'use strict';
var React = require('react-native');
var ReactPropTypes = React.PropTypes;
var assign = require('object-assign');
var keyMirror = require('key-mirror');
var EventEmitter = require('events').EventEmitter;

// AppDispatcher.jsx
var Dispatcher = require('flux').Dispatcher;
var AppDispatcher = new Dispatcher();

// TodoConstants.jsx
var TodoConstants = keyMirror({
  TODO_CREATE: null,
  TODO_COMPLETE: null,
  TODO_DESTROY: null,
  TODO_UNDO_COMPLETE: null
});

// TodoStore.jsx
var CHANGE_EVENT = 'change';

var _todos = {};

function create(text) {
  var id = (+new Date() + Math.floor(Math.random() * 999999)).toString(36);
  _todos[id] = {
    id: id,
    complete: false,
    text: text
  };
}
function update(id, updates) {
  _todos[id] = assign({}, _todos[id], updates);
}
function destroy(id) {
  delete _todos[id];
}
var TodoStore = assign({}, EventEmitter.prototype, {
  getAll: function() {
    /* ObjectをArrayにしてから返す。ウェブのReactでは必要ない。
    ListViewにした時にkeyで見ている可能性高い。
    Objectのプロパティを変更してもTodoItemのrenderが動かなかった */
    var todos = [];
    for(var key in _todos) {
      todos.push(_todos[key]);
    }
    return todos;
  },
  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },
  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },
  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }
});

AppDispatcher.register(function(action) {
  var text;
  switch(action.actionType) {
    case TodoConstants.TODO_CREATE:
      text = action.text.trim();
      if (text !== '') {
        create(text);
        TodoStore.emitChange();
      }
      break;
    case TodoConstants.TODO_UNDO_COMPLETE:
      update(action.id, {complete: false});
      TodoStore.emitChange();
      break;
    case TodoConstants.TODO_COMPLETE:
      update(action.id, {complete: true});
      TodoStore.emitChange();
      break;
    case TodoConstants.TODO_DESTROY:
      destroy(action.id);
      TodoStore.emitChange();
      break;
    default:
  }
});

// TodoActions.jsx
var TodoActions = {
  create: function(text) {
    AppDispatcher.dispatch({
      actionType: TodoConstants.TODO_CREATE,
      text: text
    });
  },
  toggleComplete: function(todo) {
    var id = todo.id;
    if (todo.complete) {
      AppDispatcher.dispatch({
        actionType: TodoConstants.TODO_UNDO_COMPLETE,
        id: id
      });
    } else {
      AppDispatcher.dispatch({
        actionType: TodoConstants.TODO_COMPLETE,
        id: id
      });
    }
  },
  destroy: function(id) {
    AppDispatcher.dispatch({
      actionType: TodoConstants.TODO_DESTROY,
      id: id
    });
  }
};

// components ////////////////////////////////////////////
var {
  AppRegistry,
  StyleSheet,
  Text,
  TextInput,
  View,
  ListView
} = React;

// TodoApp.react.jsx
var TodoApp = React.createClass({
  getInitialState: function() {
    return {
      todos: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2,
      })
    };
  },
  componentDidMount: function() {
    this.setState({
      todos: this.state.todos.cloneWithRows(TodoStore.getAll())
    });
    TodoStore.addChangeListener(this._onChange);
  },
  componentWillUnmount: function() {
    TodoStore.removeChangeListener(this._onChange);
  },
  render: function() {
  	return (
      <View style={styles.TodoApp}>
        <Header />
        <MainSection todos={this.state.todos} />
      </View>
  	);
  },
  _onChange: function() {
    this.setState({
      todos: this.state.todos.cloneWithRows(TodoStore.getAll())
    });
  }
});

// MainSection.react.jsx
var MainSection = React.createClass({
  propTypes: {
    todos: ReactPropTypes.object.isRequired
  },
  render: function() {
    return (
      <View>
        <ListView dataSource={this.props.todos} renderRow={this.renderItem} />
      </View>
    );
  },
  renderItem: function(todo) {
    return <TodoItem todo={todo} />;
  }
});

// TodoItem.react.jsx
var TodoItem = React.createClass({
  render: function() {
    var todo = this.props.todo;
    var todoItemStyle;
    todoItemStyle = (todo.complete) ? styles.TodoItemDone : styles.TodoItem;
    return (
      <View style={todoItemStyle}>
        <Text style={styles.text}>{todo.text}</Text>
        <Text onPress={() => this._onToggleComplete(todo)}>[完了]</Text>
        <Text onPress={() => this._onDestroy(todo)}>[削除]</Text>
      </View>
    ); 
  },
  _onToggleComplete: function(todo) {
    TodoActions.toggleComplete(todo);
  },
  _onDestroy: function(todo) {
    TodoActions.destroy(todo.id);
  }
});

// Header.react.jsx
var Header = React.createClass({
  render: function() {
    return (
      <View>
        <TodoTextInput />
      </View>
    );
  }
});

// TodoTextInput.react.jsx
var TodoTextInput = React.createClass({
  getInitialState: function() {
    return {
      value: ''
    }
  },
  render: function() {
    return (
      <View>
        <TextInput
          style={styles.TodoTextInput}
          onChangeText={(text) => this.setState({value: text})}
          onBlur={this._save}
          placeholder={'What needs to be done?'}
          value={this.state.value}
        />
      </View> 
    );
},
_save: function() {
  var text = this.state.value;
  if(text) TodoActions.create(text);
    this.setState({
      value: ''
    });
  }
});

/////////////////////////////////////////////////////////////////////// style
var styles = StyleSheet.create({
  TodoApp: {
    padding: 20,
    paddingTop: 40
  },
  TodoItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 58
  },
  TodoItemDone: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 58,
    opacity: .3
  },
  text: {
    flex: 1,
    textAlign: 'left',
    fontSize: 16
  },
  TodoTextInput: {
    height: 40,
    backgroundColor: '#EEEEEE',
    padding: 10,
    fontSize: 16
  }
});

////////////////////////////////////////////////////////////////////// Registry
// app.jsxに当たる部分
AppRegistry.registerComponent('TodoProject', () => TodoApp);

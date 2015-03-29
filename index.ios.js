'use strict';
var React = require('react-native');
var assign = require('object-assign');
var keyMirror = require('key-mirror');
var EventEmitter = require('events').EventEmitter;

// AppDispatcher
var Dispatcher = require('flux').Dispatcher;
var AppDispatcher = new Dispatcher();

// TodoConstances
var TodoConstances = keyMirror({
  TODO_CREATE: null,
  TODO_COMPLETE: null,
  TODO_DESTROY: null,
  TODO_DESTROY_COMPLETED: null,
  TODO_TOGGLE_COMPLETE_ALL: null,
  TODO_UNDO_COMPLETE: null,
  TODO_UPDATE_TEXT: null
});

// Store
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
function updateAll(updates) {
  for (var id in _todos) {
    update(id, updates);
  }
}
function destroy(id) {
  delete _todos[id];
}
function destroyCompleted() {
  for (var id in _todos) {
    if (_todos[id].complete) {
      destroy(id);
    }
  }
}
var TodoStore = assign({}, EventEmitter.prototype, {
  areAllComplete: function() {
    for (var id in _todos) {
      if (!_todos[id].complete) {
        return false;
      }
    }
    return true;
  },
  getAll: function() {
    return _todos;
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
    case TodoConstants.TODO_TOGGLE_COMPLETE_ALL:
      if (TodoStore.areAllComplete()) {
        updateAll({complete: false});
      } else {
        updateAll({complete: true});
      }
      TodoStore.emitChange();
      break;
    case TodoConstants.TODO_UNDO_COMPLETE:
      update(action.id, {complete: false});
      TodoStore.emitChange();
      break;
    case TodoConstants.TODO_COMPLETE:
      update(action.id, {complete: true});
      TodoStore.emitChange();
      break;
    case TodoConstants.TODO_UPDATE_TEXT:
      text = action.text.trim();
      if (text !== '') {
        update(action.id, {text: text});
        TodoStore.emitChange();
      }
      break;
    case TodoConstants.TODO_DESTROY:
      destroy(action.id);
      TodoStore.emitChange();
      break;

    case TodoConstants.TODO_DESTROY_COMPLETED:
      destroyCompleted();
      TodoStore.emitChange();
      break;
    default:
  }
});

// Action
var TodoActions = {
  create: function(text) {
    AppDispatcher.dispatch({
      actionType: TodoConstants.TODO_CREATE,
      text: text
    });
  },
  updateText: function(id, text) {
    AppDispatcher.dispatch({
      actionType: TodoConstants.TODO_UPDATE_TEXT,
      id: id,
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

// component
var {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  ListView,
  Image,
  TouchableWithoutFeedback,
  WebView
} = React;

var todos = [{
    content: 'aaaa'
  }, {
    content: 'bbb'
  }, {
    content: 'ccc'
  }
];

var TodoList = React.createClass({
  getInitialState: function() {
    return {
      items: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2,
      })
    };
  },
  componentDidMount: function() {
    this.setState({
      items: this.state.items.cloneWithRows(todos)
    });
  },
  render: function() {
    return <ListView dataSource={this.state.items} renderRow={this.renderItem} style={styles.listView}/>;
  },
  renderItem: function(item, sectionID, rowID) {
    return (
      <View style={styles.container}>
        <Text style={styles.content}>{item.content}</Text>
        <Text onPress={() => this.onPressed()}>+</Text>
      </View>
    );
  },
  onPressed: function() {
    todos.push({content: 'ddd'});
    this.setState({
      items: this.state.items.cloneWithRows(todos)
    });
  }
});

/////////////////////////////////////////////////////////////////////// style
var styles = StyleSheet.create({
  listView: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    height: 58,
    textAlign: 'left'
  }
});

////////////////////////////////////////////////////////////////////// Registry
// app.jsxに相当する感じか
AppRegistry.registerComponent('TodoProject', () => TodoList);

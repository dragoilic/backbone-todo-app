$(function(){
  var Todo = Backbone.Model.extend({

    defaults: function() {
      return {
        title: "empty todo...",
        order: Todos.nextOrder(),
        done: false
      };
    },

    toggle: function() {
      this.save({done: !this.get("done")});
    }
  });

  var TodoList = Backbone.Collection.extend({

    model: Todo,

    localStorage: new Backbone.LocalStorage("todos-backbone"),

    done: function() {
      return this.where({done: true});
    },

    remaining: function() {
      return this.where({done: false});
    },

    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    comparator: 'order'

  });

  var Todos = new TodoList;

  var TodoView = Backbone.View.extend({

    tagName:  "li",

    template: _.template($('#item-template').html()),

    events: {
      "click .wrap-toggle"   : "toggleDone",
      "click .editbtn"  : "edit",
      "click a.destroy" : "clear",
      "keypress .edit"  : "updateOnEnter",
      "dragstart": "handleDragStart",
      "dragend": "handleDragEnd",
      "dragover": "handleDragOver",
      "blur .edit"      : "close"
    },

    initialize: function() {
      this.listenTo(this.model, 'change', this.render);
      this.listenTo(this.model, 'destroy', this.remove);
    },

    render: function() {
      console.log(this.model);
      this.$el
        .html(this.template(this.model.toJSON()))
        .attr({
                draggable: 'true',
                id: this.model.cid
              });

      this.$el.toggleClass('done', this.model.get('done'));
      this.input = this.$('.edit');
      return this;
    },

    handleDragStart: function(e) {
      this.$el.addClass('dragging');
    },

    handleDragOver: function(e) {
      TodoView.currentDraggingTask = this.model;
    },

    handleDragEnd: function(e) {
      const old_list = TodoView.currentDraggingTask;
      const new_list = this.model;

      this.$el.removeClass('dragging');
      $("#todo-list").empty();

      let new_models = [];

      Todos.models.forEach(todo => {
        let append_todo = todo;

        if (todo.cid == old_list.cid) {
          new_models.push(new_list);
          append_todo = new_list
        } else if (todo.cid == new_list.cid) {
          new_models.push(old_list);   
          append_todo = old_list;     
        } else {
          new_models.push(todo);
        }

        var view = new TodoView({model: append_todo});
        $("#todo-list").append(view.render().el);
      });

      Todos.models = [ ...new_models ];
    },

    toggleDone: function() {
      this.model.toggle();
    },

    edit: function() {
      this.$el.addClass("editing");
      this.input.focus();
    },

    close: function() {
      var value = this.input.val();
      
      if (!value) {
        this.clear();
      } else {
        this.model.save({title: value});
        this.$el.removeClass("editing");
      }
    },

    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    clear: function() {
      this.model.destroy();
    }

  });

  var AppView = Backbone.View.extend({

    el: $("#todoapp"),

    statsTemplate: _.template($('#stats-template').html()),

    events: {
      "keypress #new-todo":  "createOnEnter",
      "click #toggle-all": "toggleAllComplete",
      "change #select-list": "selctTodos",
    },

    initialize: function() {

      this.input = this.$("#new-todo");
      this.allCheckbox = this.$("#toggle-all")[0];

      this.listenTo(Todos, 'add', this.addOne);
      this.listenTo(Todos, 'reset', this.addAll);
      this.listenTo(Todos, 'all', this.render);

      this.main = $('#main');

      Todos.fetch();
    },

    render: function() {
      var done = Todos.done().length;
      var remaining = Todos.remaining().length;


      if (Todos.length) {
        this.main.show();
      } else {
        this.main.hide();
      }

      this.allCheckbox.checked = !remaining;
    },

    selctTodos: function(evt) {
      var option = evt.target.value;
      var todos = Todos;

      if (option == "Show all")
        todos = Todos;
      else if (option == "Show completed")
        todos = Todos.done();
      else
        todos = Todos.remaining();

      this.$("#todo-list").empty();

      todos.forEach(todo => {
        var view = new TodoView({model: todo});
 
        this.$("#todo-list").append(view.render().el);
      });    
    },

    addOne: function(todo) {
      console.log(todo);
      var view = new TodoView({model: todo});
      this.$("#todo-list").append(view.render().el);
    },

    addAll: function() {
      Todos.each(this.addOne, this);
    },

    createOnEnter: function(e) {
      if (e.keyCode != 13) return;
      if (!this.input.val()) return;

      Todos.create({title: this.input.val()});
      this.input.val('');
    },

    toggleAllComplete: function () {
      var done = this.allCheckbox.checked;
      Todos.each(function (todo) { todo.save({'done': done}); });
    }

  });

  var App = new AppView;

});

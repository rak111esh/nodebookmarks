/*
    Bookmark view
*/
(function (Backbone, views, collections, Template, $) {
    "use strict";
    
    views.Bookmark = Backbone.View.extend({
    
        tagName: 'tr',
        
        
        
        
        className: 'bookmark',
        
        
        
        
        events: {
            'dblclick': 'loadEditor',
            
            'click .bookmark-main-edit .bookmark-edit-link': 'loadEditor',
            
            'click .bookmark-main-edit .bookmark-delete': 'deleteBookmark',
            
            'click .cancel': 'cancelEdit',
            
            'submit .bookmark-edit-form': 'saveEdit',
            
            'click #new-bookmark-form .cancel': 'cancelNew',
            
            'submit #new-bookmark-form': 'saveNew'
        },
        
        
        
        
        activeEditor: false,
        
        
        
        
        activeNew: false,
        
        
        
        
        editTemplate: new Template({url: '/javascripts/views/bookmark/tmpl/edit.ejs'}),
        
        
        
        
        bookmarkTemplate: new Template({url: '/javascripts/views/bookmark/tmpl/bookmark.ejs'}),
        
        
        
        
        newBookmarkTemplate: new Template({url: '/javascripts/views/bookmark/tmpl/new.ejs'}),
        

        
        

        /*
            Binds model events and initializes bookmark 
        */        
        initialize: function () {
            var self = this;
            
            _.bindAll(self, 'render', 'unrender', 'saveEdit', 'cancelNew', 'newBookmark', 'saveNew', 'cancelEdit', 'update', 'loadEditor', 'deleteBookmark', 'getCleanModel');

            
            self.model.on('change', function () {
                var attrs = ['publik', 'url', 'title', 'notes', 'starred', 'tags'];
                
                _.each(attrs, function(attr) {
                    if (self.model.hasChanged(attr)) {
                        self.update(attr);
                    }
                });
            });        
            
            return self;
        },
        
        
        


        /*
            Renders a bookmark view
        */        
        render: function () {
            var self = this, model = self.getCleanModel(), bookmarkTemplate;
            
            bookmarkTemplate = self.bookmarkTemplate.render(model);   
            self.$el.append(bookmarkTemplate);
            
            return self;
        },
        

        
        

        /*
            Removes a bookmark view
        */         
        unrender: function () {
            this.$el.addClass('highlight')
            
            .fadeOut(function () {
                this.$el.remove();
            }.bind(this));
        },
        
        
        
        
        
        newBookmark: function () {
            var date = this.formatDate(), newbookmarkTemplate = this.newBookmarkTemplate.render(date);
             
            this.activeNew = true;
            this.$el.append(newbookmarkTemplate);
            
            return this;
        },
        
        
        


        /*
            Handles the submitted bookmark form data after editing
            @Param: (Object) e - submit event object
        */         
        saveEdit: function (e) {
            e.preventDefault();
            
            var cleantags = [],
                self = this,            
                formObj, 
                successHandler, 
                errorHandler, 
                editFormDiv = self.$('.bookmark-edit'),
                errmsg = (App.page === 'demo') ? 'Error, unauthorised user' : 'Error occured, bookmark not updated';

            formObj = self.serializeForm('.bookmark-edit-form');

            successHandler = function (model, response) {
                self.activeEditor = false; // unlock editor
                $.shout(response.msg, 10, 'success');
                
                views.Controls.render(); // refresh tags
            };
            
            errorHandler = function (model, response) {
                self.activeEditor = false; // unlock editor
                
                $.shout(errmsg, 10);
            };
            
            editFormDiv.fadeOut(function () {
                editFormDiv.empty().hide();
                self.$('.bookmark-main').fadeIn();
            });
            
            self.model.save(formObj, {success: successHandler, error: errorHandler, wait: true});
        },
        
        
        
        
        
        /*
            Handles the submitted bookmark form data
            @Param: (Object) e - submit event object
        */         
        saveNew: function (e) {
            e.preventDefault();
            
            var formObj, 
                successHandler, 
                errorHandler, 
                self = this,
                errmsg = (App.page === 'demo') ? 'Error, unauthorised user' : 'Error occured, bookmark not saved';

            formObj = self.serializeForm('#new-bookmark-form');

            successHandler = function (model, response) {
                self.activeNew = false; // unlock
                
                self.model.set({'id': response.model.id});
                collections.Bookmarks.origModels.push(self.model);
                
                $.shout('New bookmark saved!', 10, 'success');
                
                self.$el.fadeOut('slow', function () {
                    self.$el.remove();
                    location.hash = '#bookmarks';
                });
            };
            
            errorHandler = function (model, response) {
                self.activeNew = false; // unlock
                
                $.shout(errmsg, 10);
                self.$el.fadeOut('slow', function () {
                    self.$el.remove();
                    location.hash = '#bookmarks';
                });
            };
            
            self.model.save(formObj, {success: successHandler, error: errorHandler, wait: true});
        },
        
        
        
        
        
        /*
            Handles clicking the cancel button on a new bookmark form
            @Param: (Object) e - click event object
        */          
        cancelNew: function (e) { 
            e.preventDefault();
            
            var self = this;
            
            self.$el.fadeOut('slow', function () {
                self.$el.remove();
                location.hash = '#bookmarks';
            });
        },
        


        /*
            Handles clicking the delete link
            @Param: (Object) e - click event object
        */          
        deleteBookmark: function (e) {
            e.preventDefault();
            
            var errorHandler, 
                successHandler, 
                errmsg = (App.page === 'demo') ? 'Error, unauthorised user' : 'Error occured, bookmark not deleted';
                
            if (!confirm('Are you sure you want to delete this bookmark?')) {
                return false;
            } 
               
            successHandler = function (model, response) {
                this.unrender();
                $.shout(response.msg, 10, 'success');
                collections.Bookmarks.refresh();
            }.bind(this);
            
            errorHandler = function (model, response) {
                $.shout(errmsg, 10);
            }.bind(this);
            
            this.model.destroy({success: successHandler, error: errorHandler, wait: true});
        },


        /*
            Closes the bookmark editor form and displays the bookmark
            @Param: (Object) e - click event object
        */          
        cancelEdit: function (e) { 
            e.preventDefault();
            
            this.$('.bookmark-edit').fadeOut(function () {
                this.$('.bookmark-edit').empty();
                this.$('.bookmark-main').fadeIn();
                this.activeEditor = false; // lock editor
            }.bind(this));
        },
       
        


        /*
            Handles clicking the edit link and loads the bookmark editing form
            @Param: (Object) e - click event object
        */          
        loadEditor: function (e) {
            e.preventDefault();
            
            // prevent loading of editor while one is active
            if (this.activeEditor || this.activeNew) {
                return false;
            }
            
            var model = this.model.toJSON(), editTemplate;
            
            model.tags = model.tags.length > 1 ? model.tags.join(',') : model.tags[0];
            
            editTemplate = this.editTemplate.render(model);
            
            this.$('.bookmark-main').fadeOut(function () {
                this.$('.bookmark-edit').html(editTemplate).fadeIn();
                this.activeEditor = true;
            }.bind(this));
        },
        


        /*
            Updates the view of a changed bookmark model property
            @Param: (String) view - bookmark view that has changed
        */          
        update: function (view) {
            var div, privacy, tags, span;
            
            switch (view) {
            
                case 'title':
                    this.$('.bookmark-url').html(this.model.escape('title'));
                break;
                
                
                case 'notes':
                    this.$('.bookmark-notes').html(this.model.escape('notes'));
                break;
                
                
                case 'url':
                    this.$('.bookmark-url').attr({'href': this.model.escape('url')});
                break;
                
                
                case 'tags':
                    div = this.$('.bookmark-tags');
                    div.find('.b-tag').remove();
                    tags = this.model.get('tags');
                    
                    _.each(tags, function (tag) {
                        span = $('<span>', {
                            'class': 'label',
                            'html': tag.toLowerCase() 
                        });
                        
                        div.append(span);
                    });
                break;
                
                
                case 'publik':
                    div = this.$('.bookmark-tags'); 
                
                    div.find('#label').remove();
                
                    privacy = $('<span>', {
                        'id': 'label',
                        'html': this.model.get('publik') ? 'Public' : 'Private',
                        'class': this.model.get('publik') ? 'label label-important' : 'label label-info'
                    });
                
                    div.append(privacy);
                break;
            }
        },



        /*
            Formats an integer to a date and returns an object 
            @Param: (Number- Int) date - time in milliseconds
        */          
        formatDate: function (date) {
            var newdate,  obj = {}, 
            months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            if (date) {
                newdate = new Date(parseInt(date, 10));
            }else {
                newdate = new Date();
            }

            obj.day = newdate.getDate();
            obj.month = months[newdate.getMonth()];
            obj.year = newdate.getFullYear();
            
            return obj;
        },
        
        
        
        
   
        /*
        */          
        serializeForm: function (id) {
            var formValues = this.$(id).serializeArray(), obj = {}, cleantags = [];
            
            _.each(formValues, function (fieldObj) {
                if (fieldObj.name !== 'submit') {
                    obj[fieldObj.name] = fieldObj.value;
                }
            });
            
            if (!obj.tags) {
                obj.tags = ['uncategorised'];
            }
            else {
                obj.tags = obj.tags.split(',') || [obj.tags];
                obj.publik = !(!!obj.publik);
            
                _.each(obj.tags, function (rawTag) {
                    cleantags.push(rawTag.trim());
                });
             
                obj.tags = cleantags;
            }
            
            return obj;
        },
        
        
        


        /*
            Returns a sanitized model object 
        */          
        getCleanModel: function () {
            var obj = {}, model = this.model, date = this.formatDate(model.get('date')), parser = document.createElement('a');
            
            
            obj.url = decodeURIComponent(model.get('url'));
            
            if (obj.url.indexOf('http://') < 0 && obj.url.indexOf('https://') < 0) {
                obj.url = 'http://' + obj.url;
            }
            
            parser.href = obj.url;
            
            obj.notes = model.escape('notes');
            obj.title = model.escape('title');
            obj.tags = model.get('tags');
            obj.publik = model.get('publik');
            obj.starred = model.get('starred');
            obj.id = model.get('id');
            obj.hostname = parser.hostname;
                
            obj.day = date.day;
            obj.month = date.month;
            obj.year = date.year;
            
            return obj;
        }        
    });
}(Backbone, App.Views, App.Collections, EJS, jQuery));

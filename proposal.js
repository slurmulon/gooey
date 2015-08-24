'use strict'

/////////////////////////////////////////////////////////////////////////////////
// ** WARNING **                                                               //
// The following code is not meant to be ran, it is for proposal purposes only //
/////////////////////////////////////////////////////////////////////////////////

var gooey = require('gooey')

var foo = gooey
  .service('foo', function(model) { // valid args: model, http, dom
    // .. generate some sorrt of data
    model.data = [1, 5, 20]

    return model
  })

// Basic usage

foo.subscribe('*', v => {
  console.log('responding to all changes')
})

foo.subscribe(model => { return model.data.find(v => v === 10) }, v => {
  console.log('responding to a 10 being added to data')
})

foo.data().push(10) // this would trigger both basic subscriptions to trigger (proxy object)

// Advanced usage (layers)

foo.on('dom[*]', data => {
  console.log('responding to changes to the view layer')

  data.loading = true

  return data
})

// Advanced Usage (queries)

foo.on('$.id', id => {
  console.log('responding to changes to any objects with an id on the top level')
})

foo.on('$.name', name => {
  console.log('responding to changes to any objects with name on the top level, modifying it before the change is carried through to the next layer based on the direction')

  return capitalize(name)
})

// Gooey views

// * Note that service "injection"

import gooey from gooey
// import user from app.models.run

var User = new gooey.service({
  name: 'user',
  model: (model) => {
    
  }
})

// <ban-hammer>
gooey.component({
  name  : 'BanHammer',
  view  : '<div class="btn btn-primary">Ban Chump</div>',
  model : (model, elem) => {
    User.current().on('$.banned', (banned) => {
      model.banned = banned

      if (banned) {
        alert('You just got banned!', user)
      }
    })

    model.banUser = (id) => {
      User.byId(id).upsert({banned: true})
    }
  }
  
})

// <ban-alert>
gooey.component({
  name  : 'BanAlert',
  view  : '<div class="alert growl">You\'ve been bannnnnnned</div>',
  model : (model, elem) => {
    User.current().on('$.banned', (banned) => {
      model.banned = banned

      if (banned) {
        alert('You just got banned!', user)

        _.defer(() => {
          elem.$destroy({fade: true})
        }, 5000)
      }
    })
  }
  
})

// <ban-hammer go-click="banUser(value.id)"></banned-alert>
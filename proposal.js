'use strict'

/////////////////////////////////////////////////////////////////////////////////
// ** WARNING **                                                               //
// The following code is not meant to be ran, it is for proposal purposes only //
/////////////////////////////////////////////////////////////////////////////////

var gooey = require('gooey')

var user = gooey.Service('user')

// Basic usage

user.subscribe('*', v => {
  console.log('responding to all changes')
})

user.subscribe(model => { model.data.find(v => v === 10) }, v => {
  console.log('responding to a 10 being added to data')
})

user.data().push(10) // this would trigger both basic subscriptions to trigger (proxy object)

// Advanced usage (layers)

user.on('dom[*]', data => {
  console.log('responding to changes to the view layer')

  data.loading = true

  return data
})

// Advanced Usage (queries)

user.on('$.id', id => {
  console.log('responding to changes to any objects with an id on the top level')
})

user.on('$.name', name => {
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
      if (banned) {
        alert('You just got banned!', user)

        _.defer(() => {
          elem.$destroy({fade: true})
        }, 5000)
      }
    })
  }
  
})

// <ban-hammer gy-click="banUser(value.id)"></banned-alert>
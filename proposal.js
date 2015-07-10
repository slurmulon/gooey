'use strict'

/////////////////////////////////////////////////////////////////////////////////
// ** WARNING **                                                               //
// The following code is not meant to be ran, it is for proposal purposes only //
/////////////////////////////////////////////////////////////////////////////////

var gooey = require('gooey')

var foo = gooey
  .service('cool', function(scope) { // valid args: scope, HTTP, JS, DOM
    // .. generate some sorrt of data
    scope.data = [1, 5, 20]

    return scope
  })
  .error(function(e) {
  // ...
  })

// Basic usage

foo.subscribe('*', v => {
  console.log('responding to all changes')
})

foo.subscribe(scope => { return scope.data.find(v => v === 10) }, v => {
  console.log('responding to a 10 being added to data')
})

foo.data().push(10) // this would trigger both basic subscriptions to trigger

// Advanced usage (layers)

foo.subscribe('*', 'DOM', data => {
  console.log('responding to changes to the view layer')

  data.styles = 'color: #ff0000;'

  return data
})

// Advanced Usage (queries)

foo.subscribe('$.id', id => {
  console.log('responding to changes to any objects with an id on the top level')
})

foo.subscribe('$.name', name => {
  console.log('responding to changes to any objects with name on the top level, modifying it before the change is carried through to the next layer based on the direction')

  return capitalize(name)
})

require('blanket')

var gooey  = require('../dist/index'),
    should = require('should')

describe('Services', () => {

  beforeEach(gooey.clear)

  describe('constructor', () => {
    it('should add valid services to the global service pool', () => {
      var service  = new gooey.Service('foo', () => {})
      var services = gooey.services()

      new Set([...services].map(s => s.name)).map_.entries_.should.containEql(service.name)
    })

    it('should prevent services with the same name from co-existing', () => {

    })

    it('should invoke the factory function with a reference to the Service scope object', () => {

    })

    it('should set `isRoot` to true only if the Service has no parent', () => {

    })
  })

  describe('broadcast', () => {
    
  })

  describe('subscribe', () => {
    
  })

  describe('update', () => {
    
  })

  describe('matches', () => {
    
  })

  describe('set', () => {
    
  })

})

describe('Component', () => {

})

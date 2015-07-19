require('blanket')

var gooey  = require('../dist/index'),
    should = require('should')

describe('Services', () => {

  beforeEach(gooey.clear)

  describe('constructor', () => {
    it('should add valid services to the global service pool', () => {
      let service  = new gooey.Service('foo', () => {})
      let services = gooey.services()

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
    describe('when direction is `down`', () => {
      it('should traverse child services (depth: syncronous, breadth: asynchronous)', () => {
        let fooChildService1 = new gooey.Service('child1')
        let fooChildService2 = new gooey.Service('child2')
        let fooService = new gooey.Service('foo', null, null, [fooChildService1, fooChildService2])

        let testData = {id: 123}
        let evilData = {evil: true}
        let subscriptionResults = []
        let bindSubsriptionResult = (data) => { subscriptionResults.push(data) }

        fooChildService1.subscribe('$.id', (data) => { subscriptionResults.push(data) })
        fooChildService2.subscribe('$.nothing',  () => { subscriptionResults.push(evilData) })
        fooChildService2.subscribe('$.nothing2', () => { subscriptionResults.push(evilData) })

        fooService.broadcast(testData, function(success) {
          // FIXME - this isn't getting called
          console.log('worked!', success)
        })

        subscriptionResults.should.containEql(testData)
        subscriptionResults.should.not.containEql()
      })

      it('should prevent concurrent processing of identical broadcast events (independent of direction)', () => {

      })
    })

    describe('when direction is `up`', () => {
      it('should traverse the parent service (synchronous)', () => {

      })

      it('should prevent concurrent processing of identical broadcast events (independent of direction)', () => {
        
      })
    })
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

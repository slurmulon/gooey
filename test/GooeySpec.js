require('blanket')

var gooey  = require('../dist/index'),
    should = require('should')

describe('Services', () => {

  beforeEach(gooey.clear)

  describe('constructor', () => {
    it('should not allow services to be defined without a name', () => {
      (() => {
        gooey.service()
      }).should.throw()
    })

    it('should add valid services to the global service pool', () => {
      let service  = new gooey.Service('foo')
      let services = Array.from(gooey.services())

      services.map(s => s.name).should.containEql(service.name)
    })

    it('should establish itself as a parent to all child services', () => {
      let childService1 = new gooey.Service('child1')
      let childService2 = new gooey.Service('child2')
      let parentService = new gooey.service({name: 'parent', children: [childService1, childService2]})

      childService1.parent.should.equal(parentService)
      childService2.parent.should.equal(parentService)
    })

    it('should establish itself as a child to its parent service', () => {
      let parentService = new gooey.Service('parent')
      let childService  = new gooey.service({name: 'child', parent: parentService})

      parentService.children.should.containEql(childService)
    })

    // it('should establish relationships to child services asynchronously')

    it('should prevent services with the same name from co-existing', () => {
      var service = gooey.service({name: 'foo'})

      var badService = () => {
        gooey.service({name: 'foo'})
      }

      badService.should.throw()
    })

    it('should invoke the factory function with a reference to the Service scope object', () => {
      var invoked  = false
      var service  = new gooey.Service('foo', () => { invoked = true })

      should(invoked).be.true
    })

    it('should set `isRoot` to true only if the Service has no parent', () => {
      var parentService = new gooey.Service('orphan')

      should(parentService.isRoot).be.true

      var childService = gooey.service({name: 'child', parent: parentService})

      should(childService.isRoot).be.false
    })
  })

  describe('broadcast', () => {
    describe('when direction is `down`', () => {
      it('should traverse child services (depth: syncronous, breadth: asynchronous)', () => {
        let fooChildService1 = new gooey.Service('child1')
        let fooChildService2 = new gooey.Service('child2')
        let fooService = gooey.service({name: 'foo', children: [fooChildService1, fooChildService2]})

        let testData = {id: 123}
        let evilData = {evil: true}
        let subscriptionResults = []

        fooChildService1.subscribe('$.id', (data) => { subscriptionResults.push(data) })
        fooChildService2.subscribe('$.nothing',  () => { subscriptionResults.push(evilData) })
        fooChildService2.subscribe('$.nothing2', () => { subscriptionResults.push(evilData) })

        fooService.broadcast(testData, function(success) {
          // FIXME - this isn't getting called
          console.log('worked!', success)
        })

        subscriptionResults.should.containEql(testData)
        subscriptionResults.should.not.containEql(evilData)
      })
  
      it('should modify data when appropriate before passign it off to children', () => {
        let fooChildService1 = new gooey.Service('child1')
        let fooChildService2 = new gooey.Service('child2')
        let fooServiceRoot = gooey.service({name: 'foo', children: [fooChildService1, fooChildService2]})
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

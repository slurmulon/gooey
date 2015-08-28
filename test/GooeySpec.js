import * as gooey from '../dist/index'
import should from 'should'

describe('Service', () => {

  beforeEach(gooey.clear)

  describe('constructor', () => {
    it('should be a defined method', () => {
      gooey.Service.constructor.should.type('function').be.true
    })

    it('should not allow services to be defined without a name', () => {
      gooey.service.should.throw()
    })

    it('should invoke the factory method with a reference to the data', () => {
      const service = new gooey.Service('foo', (data) => {
        data.touched = true
      })

      service.data.should.eql({touched: true})
    })

    it('should add valid services to the global service pool', () => {
      const service  = new gooey.Service('foo')
      const services = gooey.services()

      services.hasOwnProperty('foo').should.be.true
    })

    it('should establish itself as a parent to all child services', () => {
      const childService1 = new gooey.Service('child1')
      const childService2 = new gooey.Service('child2')
      const parentService = new gooey.service({name: 'parent', children: [childService1, childService2]})

      childService1.parent.should.equal(parentService)
      childService2.parent.should.equal(parentService)
    })

    it('should establish itself as a child to its parent service', () => {
      const parentService = new gooey.Service('parent')
      const childService  = new gooey.service({name: 'child', parent: parentService})

      parentService.children.should.containEql(childService)
    })

    // FIXME
    xit('should prevent services with cyclic relationships from being established (in strict mode)', () => {
      const serviceA = new gooey.Service('A')
      const serviceB = new gooey.service({name: 'B', parent: serviceA})
      const serviceC = (() => {
        new gooey.service({name: 'C', parent: serviceB, children: [serviceA]})
      }).should.throw()
    })

    it('should prevent services with the same name from co-existing', () => {
      const service1 = new gooey.Service('foo')
      const service2 = (() => { 
        gooey.service('foo')
      }).should.throw()
    })

    it('should set `isRoot` to true only if the Service has no parent', () => {
      const parentService = new gooey.Service('root')
      const childService  = new gooey.service({name: 'child', parent: parentService})

      parentService.isRoot.should.be.true
      childService.isRoot.should.be.false
    })
  })

  describe('broadcast', () => {
    it('should be a defined method', () => {
      const service = new gooey.Service('foo')

      service.broadcast.should.type('function').be.true
    })

    it('should error if an invalid traversal pattern is provided', () => {
      const service   = new gooey.Service('foo')
      const broadcast = (() => {
        service.broadcast('bar', null, null, 'crazy')
      }).should.throw()
    })

    describe('when traversal is `breadth_first_down`', () => {
      it('should recursively traverse child services (depth: syncronous, breadth: asynchronous)', () => {
        const childServiceA = new gooey.Service('childA')
        const childServiceB = new gooey.Service('childB')
        const childService1 = new gooey.Service('child1')
        const childService2 = new gooey.service({name: 'child2', children: [childServiceA, childServiceB]})
        const rootService   = new gooey.service({name: 'root',   children: [childService1, childService2]})

        const testData1 = {root: true}
        const testData2 = {inny: true}
        const testData3 = {leaf: true}
        const evilData  = {evil: true}
        const results   = []

        const resultPusher = (data) => { results.push(data) }

        rootService.subscribe('$.root',   resultPusher)
        childService1.subscribe('$.inny', resultPusher)
        childServiceA.subscribe('$.leaf', resultPusher)
        childServiceB.subscribe('$.evil', resultPusher)

        rootService.broadcast(testData1, (success) => {
          success.touchedBy = 'root'
          return success
        })

        rootService.broadcast(testData2, (success) => {
          success.touchedBy = 'inny'
          return success
        })

        rootService.broadcast(testData3, (success) => {
          success.touchedBy = 'leaf'
          return success
        })

        results.should.eql([testData1, testData2, testData3])
      })
  
      it('should modify data when a subscription matches before passing off the data to child services', () => {
        const parentService = new gooey.Service('parent')
        const childService1 = new gooey.service({name: 'child1', parent: parentService})
        const childService2 = new gooey.service({name: 'child2', parent: parentService})
        const testData = {find: true, foundBy: []}

        childService1.subscribe('$.find', (data) => {
          data.foundBy.push('childService1')
          return data
        })

        childService2.subscribe('$.find', (data) => {
          data.foundBy.push('childService2')
          return data
        })

        parentService.broadcast(testData)

        testData.foundBy.should.containEql('childService1')
        testData.foundBy.should.containEql('childService2')
      })

      it('should not modify data and return it in the original state if no subscriptions match', () => {
        const parentService = new gooey.Service('parent')
        const childService  = new gooey.service({name: 'child', parent: parentService})
        const testData = {avoid: true, foundBy: []}

        childService.subscribe('$.nothing', data => {
          data.foundBy.push('childService1')

          return data
        })

        parentService.broadcast(testData)

        testData.foundBy.should.be.empty
      })
    })

    xdescribe('when traversal is `breadth_first_up`', () => {
      it('should traverse the parent service', () => {
        // TODO
      })
    })
  })

  describe('subscribe', () => {
    it('should be a defined method', () => {
      const service = new gooey.Service('foo')

      service.subscribe.should.type('function').be.true
    })

    it('should create a subscription and return it', () => {
      let gotIt     = false
      const service = new gooey.Service('foo')
      const scrip   = service.subscribe('$', () => {
        gotIt = true
      })

      service.update({any: 'thing'})

      gotIt.should.be.true
    })

    it('should register the subscription with the Service upon creation', () => {
      const service = new gooey.Service('foo')
      const scrip   = service.subscribe('$', () => {
        gotIt = true
      })

      service.subscriptions.should.containEql(scrip)
    })

    // TODO - it('should prevent identical subscriptions from being registered')

  })

  describe('unsubscribe', () => {
    it('should be a defined method', () => {
      const service = new gooey.Service('foo')

      service.unsubscribe.should.type('function').be.true
    })

    it('should remove the subscription from the service', () => {
      const service = new gooey.Service('foo')
      const scrip   = service.subscribe('$', (data) => {
        delete data.any
        data.fail = true
      })

      service.unsubscribe(scrip)
      service.update({pass: true})

      service.data.should.have.ownProperty('pass')
      service.data.should.not.have.ownProperty('fail')
    })

    it('should freeze the object to prevent further mutation', () => {
      const service = new gooey.Service('foo')
      const scrip   = service.subscribe('$', (data) => {
        delete data.any
        data.fail = true
      })

      service.unsubscribe(scrip)

      Object.isFrozen(scrip).should.be.true      
    })
  })

  describe('update', () => {
    it('should be a defined method', () => {
      const service = new gooey.Service('foo')

      service.update.should.type('function').be.true
    })

    it('should update the Service\'s canonical source of data and broadcast the change', () => {
      const testData = {foo: 'bar'}
      const service  = new gooey.Service('parent')

      const scrip = service.on('$.foo', data => {
        data.matched = true
        return data
      })

      const update = service.use(testData, data => {
        data.updated = true
        return data
      }).then((d) => {
        testData.should.eql({foo: 'bar', matched: true, updated: true})
      })
    })
  })

  describe('merge', () => {
    it('should be a defined method', () => {
      const service = new gooey.Service('foo')

      service.merge.should.type('function').be.true
    })

    it('should merge, update and then broadcast the provided data', () => {
      const service = new gooey.Service('foo')

      service.update({a: 'a'})
      service.merge({b: 'b'})

      service.data.should.eql({a: 'a', b: 'b'})
    })
  })

  describe('matches', () => {
    it('should be a defined method', () => {
      const service = new gooey.Service('foo')

      service.matches.should.type('function').be.true
    })

    it('should only perform jsonpath matching if the configuration permits (false)', () => {
      const service     = new gooey.service({name: 'foo', config: {data: {matching: {queries: false} }}})
      const passiveData = {ignore: true}
      const results     = []

      service.subscribe('$.ignore', (data) => { results.push(data) })
      service.broadcast(passiveData)

      results.should.not.containEql(passiveData)
    })

    it('should only perform jsonpath matching if the configuration permits (true)', () => {
      const service    = new gooey.service({name: 'foo', config: {data: {matching: {queries: true} }}})
      const activeData = {find: true}
      const results    = []

      service.subscribe('$.find', (data) => { results.push(data) })
      service.broadcast(activeData)

      results.should.containEql(activeData)
    })

    it('should return jsonpath matches from all relevant subscribers', () => {
      const activeData = {find: 'bar'}
      const service    = new gooey.service({name: 'foo'})
      const scription  = service.subscribe('$.find')
      const matches    = service.matches(activeData, scription)

      Array.from(matches).should.eql(['bar'])
    })
  })

  describe('function aliases', () => {
    describe('on', () => {
      it('should be a defined method', () => {
        const service = new gooey.Service('foo')

        service.on.should.type('function').be.true
      })

      // TODO
    })

    describe('use', () => {
      it('should be a defined method', () => {
        const service = new gooey.Service('foo')

        service.use.should.type('function').be.true
      })

      // TODO
    })

    describe('up', () => {
      it('should be a defined method', () => {
        const service = new gooey.Service('foo')

        service.up.should.type('function').be.true
      })

      // TODO
    })
  })

  describe('relateTo', () => {
    it('should be a defined method', () => {
      const service = new gooey.Service('foo')

      service.relateTo.should.type('function').be.true
    })

    it('should prevent services with cyclic relationships from being established', () => {
      // TODO
    })

    it('should relate the provided service as a child only if the proposed relationship is acyclic', () => {
      // TODO
    })
  })

  describe('relateToAll', () => {
    it('should be a defined method', () => {
      const service = new gooey.Service('foo')

      service.relateToAll.should.type('function').be.true
    })

    // TODO
    it('should relate each provided service as a child')
  })

  describe('isRoot', () => {
    it('should be a defined method', () => {
      const service = new gooey.Service('foo')

      service.isRoot.should.type('function').be.true
    })

    it('should determine if service is a root in the tree', () => {
      const root = new gooey.Service('root')

      should.equal(root.parent, null)
      root.isRoot().should.be.true

      const child = new gooey.service({name: 'child', parent: root})

      child.isRoot().should.be.false
    })
  })

  describe('isLeaf', () => {
    it('should be a defined method', () => {
      const service = new gooey.Service('foo')

      service.isLeaf.should.type('function').be.true
    })

    it('should return true for orphan nodes', () => {
       new gooey.Service('orphan').isLeaf().should.be.true
    })

    it('should return false for any parent node', () => {
      const parent = new gooey.Service('parent')
      const child  = new gooey.Service('child')

      parent.isLeaf().should.be.false
      child.isLeaf().should.be.true
    })

    it('should return true for any leaf node', () => {
      const root  = new gooey.Service('root')
      const mid   = new gooey.service({name: 'mid',   parent: root})
      const leaf1 = new gooey.service({name: 'leaf1', parent: mid})
      const leaf2 = new gooey.service({name: 'leaf2', parent: mid})

      root.isLeaf().should.be.false
      mid.isLeaf().should.be.false
      leaf1.isLeaf().should.be.true
      leaf2.isLeaf().should.be.true
    })

  })

  describe('findRoots', () => {
    it('should be a defined method', () => {
      gooey.Service.findRoots.should.type('function').be.true
    })
  })

  describe('findLeafs', () => {
    it('should be a defined method', () => {
      gooey.Service.findLeafs.should.type('function').be.true
    })

    // TODO
  })

  describe('depth', () => {
    it('should be a defined method', () => {
      const service = new gooey.Service('foo')

      service.depth.should.type('function').be.true
    })

    it('should return the Service\'s depth in the tree heirarchy', () => {
      const parent = new gooey.Service('parent')
      const child1 = new gooey.service({name: 'child',  parent: parent})
      const child2 = new gooey.service({name: 'child2', parent: parent})
      const childSub1 = new gooey.service({name: 'childSub1', parent: child1})

      parent.depth().should.equal(0)
      child1.depth().should.equal(1)
      child2.depth().should.equal(1)
      childSub1.depth().should.equal(2)
    })
  })

  describe('cycleExists', () => {
    it('should be a defined method', () => {
      gooey.Service.cycleExists.should.type('function').be.true
    })

    it('should return true if there are any cycles in the tree (non-strict mode)', () => {
      const serviceA = new gooey.service({name: 'A', config: {strict: false}})
      const serviceB = new gooey.service({name: 'B', parent: serviceA})
      const serviceC = new gooey.service({name: 'C', parent: serviceB, children: [serviceA]})

      new gooey.Service.cycleExists().should.be.true
    })

    it('should reurn false if the tree is acyclic', () => {
      const serviceA = new gooey.Service('A')
      const serviceB = new gooey.service({name: 'B', parent: serviceA})
      const serviceC = new gooey.service({name: 'C', parent: serviceA})

      new gooey.Service.cycleExists().should.be.false
    })
  })

})

describe('Component', () => {

})

import * as gooey from '../lib/index'
import should from 'should'

describe('Service', () => {

  beforeEach(gooey.clear)

  describe('constructor', () => {
    it('should not allow services to be defined without a name', () => {
      gooey.service.should.throw()
    })

    it('should invoke the model method with a reference to the service\'s state object', () => {
      const service = new gooey.Service('foo', data => {
        data.touched = true
      })

      service.state.should.eql({touched: true})
    })

    it('should add valid services to the global service pool', () => {
      const service  = new gooey.Service('foo')
      const services = gooey.services()

      services.hasOwnProperty('foo').should.be.true()
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
    xit('should prevent services with cyclic relationships from being established', () => {
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

      parentService.isRoot().should.be.true()
      childService.isRoot().should.be.false()
    })
  })

  describe('publish', () => {
    it('should error if an invalid traversal strategy is provided', () => {
      new gooey.Service('foo').publish('bar', 'crazy').should.be.rejected
    })

    describe('when traversal is `breadth` and direction is `down`', () => {
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

        rootService.publish(testData1).then(success => {
          success.touchedBy = 'root'
          return success
        })

        rootService.publish(testData2).then(success => {
          success.touchedBy = 'inny'
          return success
        })

        rootService.publish(testData3).then(success => {
          success.touchedBy = 'leaf'
          return success
        })

        results.should.eql([testData1, testData2, testData3])
      })
  
      it('should safely modify data when a subscription matches before passing off the data to child services', () => {
        const parent   = new gooey.Service('parent')
        const child    = new gooey.service({name: 'child', parent})
        const testData = {find: true, foundBy: []}

        parent.subscribe('$.find', data => {
          data.foundBy.push('parent')
          return data
        })

        const testScrip = child.subscribe('$.find', data => {
          data.foundBy.push('child')
          return data
        })

        const result = parent.publish(testData)

        result.should.eventually.containEql('parent')
        result.should.eventually.containEql('child')
      })

      it('should not modify data and return it in the original state if no subscriptions match', () => {
        const parentService = new gooey.Service('parent')
        const childService  = new gooey.service({name: 'child', parent: parentService})
        const testData = {avoid: true, foundBy: []}

        childService.subscribe('$.nothing', data => {
          data.foundBy.push('childService1')

          return data
        })

        parentService.publish(testData)

        testData.foundBy.should.be.empty
      })

      xit('should ensure that subscription matches are performed safely',  () => {
        // TODO
      })

      xit('should properly synchronize identical matching subscription responses (same strategy, same service', () => {
        // TODO
      })
    })

    describe('when traversal is `breadth` and direction is `up`', () => {
      it('should traverse all nodes sharing the depth (siblings) of the parent service (including parent)', () => {
        const testData = {foundBy: []}
        const testTopic = '$'

        const a1 = new gooey.service({name: 'A1'})
        const a2 = new gooey.service({name: 'A2'})
        const a1b1 = new gooey.service({name: 'A1B1', parent: a1})
        const a1b2 = new gooey.service({name: 'A1B2', parent: a1})
        const a2b1 = new gooey.service({name: 'A2B1', parent: a2})
        const a2b2 = new gooey.service({name: 'A2B2', parent: a2})
        const a1b1c1 = new gooey.service({name: 'A1B1C1', parent: a1b1})

        const services = gooey.services()

        Object.keys(services).forEach(key => {
          const service = services[key]

          service.subscribe(testTopic, (data) => {
            data.foundBy.push(service.name)

            return data
          })
        })

        const result = a1b1c1.publish(testData, 'breadth', 'up').then(result => {
          return result
        })

        // TODO - export this to util or something
        const isUnique = (arr = []) => {
          const cache   = {}
          const results = []

          arr.forEach((elem, i) => {
            if (cache[elem] === true) {
              results.push(elem)
            } else {
              cache[elem] = true
            }
          })

          return !results.length
        }

        // FIXME - switch to chaiAsPromised, the following assertions should work but have no effect whatsoever
        // result.should.be.finally.equal(testData.foundBy)

        // result.should.eventually.containEql(Object.keys(services))

        // testData.foundBy.should.include(Object.keys(services))

        isUnique(testData.foundBy).should.be.true()
      })
    })

    xdescribe('when traversal is `depth` and direction is `down`', () => {
      it('should traverse the parent service', () => {
        // TODO
      })
    })

    xdescribe('when traversal is `depth` and direction is `up`', () => {
      it('should traverse the parent service', () => {
        // TODO
      })
    })

    it('should properly support nested publish calls to disjoint services', () => {
      const serviceA = new gooey.Service('A')
      const serviceB = new gooey.Service('B')
      const testData = {}

      serviceA.subscribe('$', () => {
        testData.a = true
        serviceB.update(testData)
      })

      serviceB.subscribe('$.a', () => {
        testData.b = true
      })

      serviceA.publish(testData)

      testData.should.have.ownProperty('a')
      testData.should.have.ownProperty('b')
    })

    xit('should be able to properly synchronize identical publish events that are being executed concurrently', () => {
      // TODO - should be ready for testing
    })

    xit('should traverse the service tree using a hamiltonian path', () => {
      // TODO
    })
  })

  describe('subscribe', () => {
    it('should create a subscription and return it', () => {
      let works     = false
      const service = new gooey.Service('foo')
      const scrip   = service.subscribe('$', () => {
        works = true
      })

      service.update({any: 'thing'})

      works.should.be.true()
    })

    it('should register the subscription with the Service upon creation', () => {
      const service = new gooey.Service('foo')
      const scrip   = service.subscribe('$', () => {
        works = true
      })

      service.subscriptions.should.containEql(scrip)
    })

    // TODO - it('should prevent identical subscriptions from being registered')

  })

  describe('unsubscribe', () => {
    it('should remove the subscription from the service', () => {
      const service = new gooey.Service('foo')
      const scrip   = service.subscribe('$', (data) => {
        delete data.pass
        data.fail = true
      })

      service.unsubscribe(scrip)
      service.update({pass: true})

      service.state.should.have.ownProperty('pass')
      service.state.should.not.have.ownProperty('fail')
    })

    it('should set the subscription as in-active, preventing further mutation', () => {
      const service = new gooey.Service('foo')
      const scrip   = service.subscribe('$', (data) => {
        data.fail = true
      })

      service.unsubscribe(scrip)
      service.update({pass: true})

      scrip.active.should.be.false()

      service.state.should.have.ownProperty('pass')
      service.state.should.not.have.ownProperty('fail')
    })

    it('should freeze the subscription to prevent further mutation when freeze is set to true', () => {
      const service = new gooey.Service('foo')
      const scrip   = service.subscribe('$', (data) => {
        data.fail = true
      })

      service.unsubscribe(scrip, true)
      service.update({pass: true})

      Object.isFrozen(scrip).should.be.true()

      service.state.should.have.ownProperty('pass')
      service.state.should.not.have.ownProperty('fail')
    })

    it('should not freeze the subscription when freeze is set to false', () => {
      const service = new gooey.Service('foo')
      const scrip   = service.subscribe('$', (data) => {
        data.fail = true
      })

      service.unsubscribe(scrip, false)
      service.update({pass: true})

      Object.isFrozen(scrip).should.be.false()

      service.state.should.have.ownProperty('pass')
      service.state.should.not.have.ownProperty('fail')
    })
  })

  describe('update', () => {
    it('should update the Service\'s canonical source of data and publish the change', () => {
      const testData = {foo: 'bar'}
      const service  = new gooey.Service('parent')

      const scrip = service.on('$.foo', data => {
        data.matched = true

        return data
      })

      const update = service.use(testData).then(data => {
        data.updated = true

        return data
      }).then(() => {
        testData.should.eql({foo: 'bar', matched: true, updated: true}) // FIXME - should doesn't asser this
      })
    })
  })

  describe('merge', () => {
    it('should merge, update and then publish the provided data', () => {
      const service = new gooey.Service('foo')

      service.update({a: 'a'})
      service.merge({b: 'b'})

      service.state.should.eql({a: 'a', b: 'b'})
    })
  })

  describe('matches', () => {
    it('should invoke `matches` on the provided Subscription', () => {
      const testData  = {foo: 'bar'}
      const service   = new gooey.service({name: 'foo'})
      const scripStub = Object.create(gooey.Subscription.prototype)

      scripStub.matches = (data) => [data]

      const result = service.matches(testData, scripStub)

      result.should.containEql(testData)
    })
  })

  describe('function aliases', () => {
    xdescribe('on', () => {
      // TODO
      const service = new gooey.service({name: 'foo'})

      service.on('*', () => 'works')
    })

    xdescribe('use', () => {
      // TODO
    })

    xdescribe('up', () => {
      // TODO
    })
  })

  xdescribe('relateTo', () => {
    xit('should prevent services with cyclic relationships from being established', () => {
      // TODO
    })

    xit('should relate the provided service as a child only if the proposed relationship is acyclic', () => {
      // TODO
    })
  })

  describe('relateToAll', () => {
    it('should relate each provided service as a parent', () => {
      const parent = new gooey.Service('parent')
      const child1 = new gooey.Service('child1')
      const child2 = new gooey.Service('child2')

      parent.relateToAll([child1, child2])

      child1.parent.should.equal(parent)
      child2.parent.should.equal(parent)
    })
  })

  describe('isRoot', () => {
    it('should determine if service is a root in the tree', () => {
      const root = new gooey.Service('root')

      should.equal(root.parent, null)
      root.isRoot().should.be.true()

      const child = new gooey.service({name: 'child', parent: root})

      child.isRoot().should.be.false()
    })
  })

  describe('isLeaf', () => {
    it('should return true for orphan nodes', () => {
       new gooey.Service('orphan').isLeaf().should.be.true()
    })

    it('should return false for any parent node', () => {
      const parent = new gooey.Service('parent')
      const child  = new gooey.service({name: 'child', parent})

      parent.isLeaf().should.be.false()
      child.isLeaf().should.be.true()
    })

    it('should return true for any leaf node', () => {
      const root  = new gooey.Service('root')
      const mid   = new gooey.service({name: 'mid',   parent: root})
      const leaf1 = new gooey.service({name: 'leaf1', parent: mid})
      const leaf2 = new gooey.service({name: 'leaf2', parent: mid})

      root.isLeaf().should.be.false()
      mid.isLeaf().should.be.false()
      leaf1.isLeaf().should.be.true()
      leaf2.isLeaf().should.be.true()
    })

  })

  xdescribe('findRoots', () => {
    // TODO
  })

  describe('findLeafs', () => {
    // TODO
  })

  describe('depth', () => {
    it('should return the Service\'s depth in the tree hierarchy', () => {
      const parent = new gooey.Service('parent')
      const child1 = new gooey.service({name: 'child',  parent: parent})
      const child2 = new gooey.service({name: 'child2', parent: parent})
      const childSub1 = new gooey.service({name: 'childSub1', parent: child1})

      parent.depth().should.equal(0)
      child1.depth().should.equal(1)
      child2.depth().should.equal(1)
      childSub1.depth().should.equal(2)
    })

    describe('siblings', () => {
      describe('global search', () => {
        it('should return all services in the hierarchy with the same depth, excluding the initiating service', () => {
          const parent = new gooey.Service('parent')
          const child1 = new gooey.service({name: 'child1', parent: parent})
          const child2 = new gooey.service({name: 'child2', parent: parent})
          const childSub1 = new gooey.service({name: 'childSub1', parent: child1})
          const childSub2 = new gooey.service({name: 'childSub2', parent: child2})
          const childSub3 = new gooey.service({name: 'childSub3', parent: child2})

          parent.siblings().should.be.empty
          child1.siblings().map(s => s.name).should.eql(['child2'])
          child2.siblings().map(s => s.name).should.eql(['child1'])
          childSub1.siblings().map(s => s.name).should.eql(['childSub2', 'childSub3'])
          childSub2.siblings().map(s => s.name).should.eql(['childSub1', 'childSub3'])
          childSub3.siblings().map(s => s.name).should.eql(['childSub1', 'childSub2'])
        })
      })

      xdescribe('local search', () => {
        it('should return all service in the hierarchy with the same immediate parent', () => {
          // TODO
        })
      })
    })
  })

  describe('cycleExists', () => {
    it('should return true if there are any cycles in the tree', () => {
      const serviceA = new gooey.service({name: 'A'})
      const serviceB = new gooey.service({name: 'B', parent: serviceA})
      const serviceC = new gooey.service({name: 'C', parent: serviceB, children: [serviceA]})

      gooey.Service.cycleExists().should.be.true()
    })

    it('should reurn false if the tree is acyclic', () => {
      const serviceA = new gooey.Service('A.2')
      const serviceB = new gooey.service({name: 'B.2', parent: serviceA})
      const serviceC = new gooey.service({name: 'C.2', parent: serviceA})

      gooey.Service.cycleExists().should.be.false()
    })
  })

})

describe('Subscription', () => {

  beforeEach(gooey.clear)

  describe('matches', () => {
    describe('basic', () => {
      it('should perform simple equality comparison', () => {
        const service = new gooey.Service('foo')
        const results = []

        service.subscribe(123, data => results.push(true))
        service.publish(123)

        results.should.containEql(true)
      })
    })

    describe('JsonPath', () => {
      it('should only perform jsonpath matching if the configuration permits (false)', () => {
        const service     = new gooey.service({name: 'foo', config: {data: {matching: false }}})
        const passiveData = {ignore: true}
        const results     = []

        service.subscribe('$.ignore', data => { results.push(data) })
        service.publish(passiveData)

        results.should.not.containEql(passiveData)
      })

      it('should only perform json-where matching if the configuration permits (true)', () => {
        const service    = new gooey.service({name: 'foo', config: {data: {matching: true }}})
        const activeData = {find: true}
        const results    = []

        service.subscribe('$.find', data => { results.push(data) })
        service.publish(activeData)

        results.should.containEql(activeData)
      })

      it('should return json-where matches from all relevant subscribers', () => {
        const activeData = {find: 'bar'}
        const service    = new gooey.service({name: 'foo'})
        const scription  = service.subscribe('$.find')
        const matches    = service.matches(activeData, scription)

        Array.from(matches).should.eql(['bar'])
      })
    })
  })

})

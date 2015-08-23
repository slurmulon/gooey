require('blanket')

import * as gooey from '../dist/index'
import should from 'should'

describe('Services', () => {

  beforeEach(gooey.clear)

  describe('constructor', () => {
    it('should be a defined method', () => {
      gooey.Service.constructor.should.type('function').be.true
    })

    it('should invoke the factory method with a reference to the data', () => {
      const service = new gooey.Service('foo', (data) => {
        data.touched = true
      })

      service.data.should.eql({touched: true})
    })

    it('should not allow services to be defined without a name', () => {
      (() => {
        gooey.service()
      }).should.throw()
    })

    it('should add valid services to the global service pool', () => {
      const service  = new gooey.Service('foo')
      const services = gooey.services()
      const exists   = 'foo' in services

      exists.should.be.true
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

    describe('when direction is `down`', () => {
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

    describe('when direction is `up`', () => {
      it('should traverse the parent service (synchronous)', () => {

      })
    })
  })

  describe('subscribe', () => {
    it('should create a subscription and return it', () => {

    })

    it('should register the subscription with the Service upon creation', () => {

    })
  })

  xdescribe('update', () => {
    it('should update the Service\'s canonical source of data and broadcast the change', () => {
      const testData = {foo: 'bar'}
      const service  = new gooey.Service('parent')

      const scrip = service.on('$.foo', data => {
        data.matched = true
        return data
      })

      const update = service.use(testData).then(data => {
        data.updated = true
        return data
      })

      testData.should.eql({foo: 'bar', matched: true, updated: true})
    })
  })

  describe('matches', () => {
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

  describe('update', () => {
    
  })

  describe('upsert', () => {

  })

  describe('upsert', () => {
  })

  describe('function aliases', () => {
    describe('on', () => {

    })

    describe('use', () => {

    })

    describe('up', () => {

    })
  })

  describe('relateTo', () => {

  })

  describe('relateToAll', () => {

  })

  describe('isRoot', () => {
    const root = new gooey.Service('root')

    should.equal(root.parent, null)
    root.isRoot().should.be.true

    const child = new gooey.service({name: 'child', parent: root})

    child.isRoot().should.be.false
  })

  describe('isLeaf', () => {
    it('should return true for orphan nodes', () => {
       new gooey.Service('orphan').isLeaf().should.be.true
    })

    it('should return false any parent node', () => {
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

})

describe('Component', () => {

})

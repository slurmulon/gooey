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
      const service  = new gooey.Service('foo')
      const services = Array.from(gooey.services())

      services.map(s => s.name).should.containEql(service.name)
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
      const service2 = () => { new gooey.Service('foo') }

      service2.should.throw()
    })

    it('should set `isRoot` to true only if the Service has no parent', () => {
      const parentService = new gooey.Service('root')
      const childService  = new gooey.service({name: 'child', parent: parentService})

      parentService.isRoot.should.be.true
      childService.isRoot.should.be.false
    })
  })

  describe('broadcast', () => {
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
        let   results   = []

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

      it('should syncronize the execution of identical broadcast events (independent of direction)', () => {

      })
    })

    describe('when direction is `up`', () => {
      it('should traverse the parent service (synchronous)', () => {

      })

      it('should syncronize the execution of identical broadcast events (independent of direction)', () => {

      })
    })
  })

  describe('subscribe', () => {
    
  })

  describe('update', () => {
    
  })

  describe('matches', () => {
    it('should only perform jsonpath matching if the configuration permits (false)', () => {
      const service     = new gooey.service({name: 'foo', config: {data: {matching: {queries: false} }}})
      const passiveData = {ignore: true}
      let   results     = []

      service.subscribe('$.ignore', (data) => { results.push(data) })
      service.broadcast(passiveData)

      results.should.not.containEql(passiveData)
    })

    it('should only perform jsonpath matching if the configuration permits (true)', () => {
      const service     = new gooey.service({name: 'foo', config: {data: {matching: {queries: true} }}})
      const activeData  = {find: true}
      let   results     = []

      service.subscribe('$.find', (data) => { results.push(data) })
      service.broadcast(activeData)

      results.should.containEql(activeData)
    })

    it('should return jsonpath matches from all relevant subscribers', () => {
      const activeData  = {find: 'bar'}
      const service     = new gooey.service({name: 'foo'})
      const scription   = service.subscribe('$.find')
      const matches     = service.matches(activeData, scription)

      Array.from(matches).should.eql([
        {pattern: '$.find', matches: ['bar']}
      ])
    })
  })

  describe('set', () => {
    
  })

})

describe('Component', () => {

})

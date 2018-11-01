/* globals web3, artifacts, contract, beforeEach, describe, it, assert */

const Name = artifacts.require('Name')

contract('mint test', async (accounts) => {
  let ben = accounts[1]

  it('should have name', async () => {
    let instance = await Name.deployed()
    let name = await instance.name.call()
    assert.equal(name.valueOf(), 'Cryptovoxels Name')
  })

  it('should have symbol', async () => {
    let instance = await Name.deployed()
    let name = await instance.symbol.call()
    assert.equal(name.valueOf(), 'NAME')
  })

  it('should have tokens', async () => {
    let instance = await Name.deployed()
    let balance = await instance.totalSupply.call()
    assert(balance.valueOf() > 0)
  })

  describe('mint', async () => {
    let instance = await Name.deployed()

    it('returns token by owner', async () => {
      await instance.mint(ben, 'benno', { from: ben })

      let r = await instance.totalSupply.call()
      let i = parseInt(await r.valueOf(), 10)
      assert.equal(i, 1)

      const token = await instance.tokenOfOwnerByIndex(ben, 0)
      assert.equal(token.valueOf(), i)

      let result = await instance.tokenURI(i)
      assert.equal(result.valueOf(), `https://www.cryptovoxels.com/n/${i}`)

      let name = await instance.getName(i)
      assert.equal(name.valueOf(), 'benno')
    })

    it('should increase token id', async () => {
      await instance.mint(ben, 'abc', { from: ben })

      let r = await instance.totalSupply.call()
      let i = parseInt(await r.valueOf(), 10)
      assert(i > 0)

      await instance.mint(ben, 'bcd', { from: ben })
      r = await instance.totalSupply.call()
      let j = parseInt(r.valueOf(), 10)
      assert.equal(i + 1, j)

      await instance.mint(ben, 'cde', { from: ben })
      r = await instance.totalSupply.call()
      let k = parseInt(r.valueOf(), 10)
      assert.equal(j + 1, k)
    })

    it('should fail for reuse of name', async function () {
      await instance.mint.call(ben, 'SomeMadThing', { from: ben })

      try {
        await instance.mint.call(ben, 'benno', { from: ben })
        assert.fail('Expected to throw')
      } catch (e) {
        assert(true)
      }

      try {
        await instance.mint.call(ben, 'BENNO', { from: ben })
        assert.fail('Expected to throw')
      } catch (e) {
        assert(true)
      }

      try {
        await instance.mint.call(ben, 'BeNno', { from: ben })
        assert.fail('Expected to throw')
      } catch (e) {
        assert(true)
      }
    })

    it('should fail for invalid names', async function () {
      try {
        await instance.mint.call(ben, '😃', { from: ben })
        assert.fail('Expected to throw')
      } catch (e) {
        assert(true)
      }

      try {
        await instance.mint.call(ben, 'SUCKS LOTS', { from: ben })
        assert.fail('Expected to throw')
      } catch (e) {
        assert(true)
      }

      try {
        await instance.mint.call(ben, '-_-', { from: ben })
        assert.fail('Expected to throw')
      } catch (e) {
        assert(true)
      }

      try {
        await instance.mint.call(ben, 'xx-', { from: ben })
        assert.fail('Expected to throw')
      } catch (e) {
        assert(true)
      }

      try {
        await instance.mint.call(ben, '--xxxxxx', { from: ben })
        assert.fail('Expected to throw')
      } catch (e) {
        assert(true)
      }

      try {
        await instance.mint.call(ben, '', { from: ben })
        assert.fail('Expected to throw')
      } catch (e) {
        assert(true)
      }

      try {
        await instance.mint.call(ben, 'ab', { from: ben })
        assert.fail('Expected to throw')
      } catch (e) {
        assert(true)
      }

      try {
        await instance.mint.call(ben, 'abaregaergaergaergaergaergaerg', { from: ben })
        assert.fail('Expected to throw')
      } catch (e) {
        assert(true)
      }
    })
  })
})

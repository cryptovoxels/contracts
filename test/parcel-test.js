/* globals web3, artifacts, contract, beforeEach, describe, it, assert */

const Parcel = artifacts.require('Parcel')

contract('mint test', async (accounts) => {
  const creator = accounts[0]

  let ben = accounts[1]
  let sam = accounts[2]
  let dave = accounts[3]

  const firstTokenId = 1
  const secondTokenId = 2

  it('should have name', async () => {
    let instance = await Parcel.deployed()
    let name = await instance.name.call()
    assert.equal(name.valueOf(), 'Cryptovoxels Parcel')
  })

  it('should have symbol', async () => {
    let instance = await Parcel.deployed()
    let name = await instance.symbol.call()
    assert.equal(name.valueOf(), 'CVPA')
  })

  it('should have 0 tokens', async () => {
    let instance = await Parcel.deployed()
    let balance = await instance.totalSupply.call()
    assert.equal(balance.valueOf(), 0)
  })

  it('should have owner', async () => {
    let instance = await Parcel.deployed()
    let owner = await instance.owner.call()
    assert.equal(owner.valueOf(), creator)
  })

  describe('parcel token functions', function () {
    beforeEach(async function () {
      this.token = await Parcel.new({ from: creator })
    })

    beforeEach(async function () {
      await this.token.mint(creator, firstTokenId, -7, -8, -9, 3, 4, 5, 0, { from: creator })
      await this.token.mint(creator, secondTokenId, 6, 6, 6, 10, 10, 10, 0, { from: creator })
    })

    describe('balance', function () {
      it('should have 2 tokens', async function () {
        let balance = await this.token.totalSupply.call()
        assert.equal(balance.valueOf(), 2)
      })
    })

    describe('mint', function () {
      const tokenId = 3

      it('returns token by owner', async function () {
        await this.token.mint(ben, tokenId, 11, 11, 11, 15, 15, 15, 0)

        const token = await this.token.tokenOfOwnerByIndex(ben, 0)
        assert.equal(token.valueOf(), tokenId)

        let result = await this.token.tokenURI(tokenId)
        assert.equal(result.valueOf(), `https://www.cryptovoxels.com/p/${tokenId}`)
      })

      it('sets price of token', async function () {
        await this.token.mint(creator, tokenId, 11, 11, 11, 15, 15, 15, 1234)

        let price = await this.token.getPrice.call(tokenId)
        assert.equal(price.valueOf(), 1234)
      })

      it('test price is null if not owned by creator', async function () {
        await this.token.mint(dave, tokenId, 11, 11, 11, 15, 15, 15, 1234)

        let price = await this.token.getPrice.call(tokenId)
        assert.equal(price.valueOf(), 0)
      })

      it('sets really high token id', async function () {
        let tokenId = 123123124124124124

        await this.token.mint(ben, tokenId, 11, 11, 11, 15, 15, 15, 1234)

        let result = await this.token.tokenURI(tokenId)
        assert.equal(result.valueOf(), `https://www.cryptovoxels.com/p/${tokenId}`)
      })

      it('should fail for other user', async function () {
        try {
          await this.token.mint(ben, tokenId, 11, 11, 11, 15, 15, 15, 0, { from: ben })
          assert.fail('Expected to throw')
        } catch (e) {
          assert(true)
        }
      })
    })

    describe('owner', function () {
      const tokenId = 4

      it('should take ownership', async function () {
        let owner = await this.token.owner()
        assert.equal(owner.valueOf(), creator)

        // Transfer away
        await this.token.transferOwnership(dave, { from: creator })
        owner = await this.token.owner()
        assert.equal(owner.valueOf(), dave)

        // Regain control
        await this.token.takeOwnership({ from: creator })

        owner = await this.token.owner()
        assert.equal(owner.valueOf(), creator)
      })

      it('should fail to take ownership for other user', async function () {
        try {
          await this.token.takeOwnership({ from: ben })
          assert.fail('Expected to throw')
        } catch (e) {
          assert(true)
        }
      })

      it('should transfer ownership', async function () {
        let owner = await this.token.owner()
        assert.equal(owner.valueOf(), creator)

        // Go to dave
        await this.token.transferOwnership(dave, { from: creator })

        owner = await this.token.owner()
        assert.equal(owner.valueOf(), dave)

        // Create token and set price
        await this.token.mint(creator, tokenId, 11, 11, 11, 15, 15, 15, 0, { from: dave })
        await this.token.setPrice(tokenId, 4233, { from: dave })

        let result = await this.token.ownerOf(tokenId)
        assert.equal(result.valueOf(), creator)

        let price = await this.token.getPrice.call(tokenId)
        assert.equal(price.valueOf(), 4233)

        // Buy token (can do regardless of current contract ownership)
        await this.token.buy(tokenId, { from: ben, value: 4233 })

        // Check token owner
        result = await this.token.ownerOf(tokenId)
        assert.equal(result.valueOf(), ben)

        price = await this.token.getPrice.call(tokenId)
        assert.equal(price.valueOf(), 0)

        // Return to creator
        await this.token.transferOwnership(creator, { from: dave })

        // Check ownership
        owner = await this.token.owner()
        assert.equal(owner.valueOf(), creator)
      })
    })

    describe('mint / buy process', function () {
      let tokenId = 100
      let price = web3.toWei(0.27, 'ether')

      it('should buy and setContentURI', async function () {
        await this.token.mint(creator, tokenId, 2, 0, 2, 15, 9, 20, price, { from: creator })
        await this.token.buy(tokenId, { from: ben, value: price })

        let testUrl = 'ipfs:QmPXME1oRtoT627YKaDPDQ3PwA8tdP9rWuAAweLzqSwAWS'
        await this.token.setContentURI(tokenId, testUrl, { from: ben })

        let url = await this.token.contentURI(tokenId)
        assert.equal(url.valueOf(), testUrl)

        let result = await this.token.getPrice.call(tokenId)
        assert.equal(result.valueOf(), 0)
      })
    })

    describe('set / get price', function () {
      it('should have 0 price', async function () {
        let balance = await this.token.getPrice.call(firstTokenId)
        assert.equal(balance.valueOf(), 0)
      })

      it('should set / get price', async function () {
        await this.token.setPrice(firstTokenId, 1234)

        let price = await this.token.getPrice.call(firstTokenId)
        assert.equal(price.valueOf(), 1234)
      })

      it('should fail for other user', async function () {
        try {
          await this.setPrice.burn(firstTokenId, 1234, { from: ben })

          assert.fail('Expected to throw')
        } catch (e) {
          assert(true)
        }
      })

      it('should set / buy', async function () {
        await this.token.setPrice(firstTokenId, 1234)
        await this.token.buy(firstTokenId, { from: ben, value: 1234 })
        let price = await this.token.getPrice.call(firstTokenId)
        assert.equal(price.valueOf(), 0)
      })
    })

    describe('burn', function () {
      it('should delete 1 token', async function () {
        await this.token.burn(secondTokenId)
        let balance = await this.token.totalSupply.call()
        assert.equal(balance.valueOf(), 1)
      })

      it('should fail for other user', async function () {
        try {
          await this.token.burn(secondTokenId, { from: ben })

          assert.fail('Expected to throw')
        } catch (e) {
          assert(true)
        }
      })
    })

    describe('getBoundingBox', function () {
      it('should return bounds', async function () {
        let result = await this.token.getBoundingBox.call(firstTokenId)

        assert.equal(result[0].valueOf(), -7)
        assert.equal(result[1].valueOf(), -8)
        assert.equal(result[2].valueOf(), -9)
        assert.equal(result[3].valueOf(), 3)
        assert.equal(result[4].valueOf(), 4)
        assert.equal(result[5].valueOf(), 5)
      })

      it('should return second bounds', async function () {
        let result = await this.token.getBoundingBox.call(secondTokenId)

        assert.equal(result[0].valueOf(), 6)
        assert.equal(result[1].valueOf(), 6)
        assert.equal(result[2].valueOf(), 6)
      })
    })

    describe('setContentURI', function () {
      let testUrl = 'http://frog/bog/log'

      beforeEach(async function () {
        await this.token.transferFrom(creator, ben, secondTokenId, { from: creator })
      })

      it('should set and get', async function () {
        await this.token.setContentURI(secondTokenId, testUrl, { from: ben })

        let url = await this.token.contentURI(secondTokenId)
        assert.equal(url.valueOf(), testUrl)
      })

      it('should fail for other user', async function () {
        try {
          await this.token.setContentURI(secondTokenId, testUrl, { from: sam })

          assert.fail('Expected to throw')
        } catch (e) {
          assert(true)
        }

        let url = await this.token.contentURI(secondTokenId)
        assert.equal(url.valueOf(), '')
      })
    })

    describe('transferFrom sanity check', function () {
      it('should transfer ownership sanely', async function () {
        await this.token.transferFrom(creator, ben, firstTokenId, { from: creator })

        try {
          await this.token.transferFrom(creator, sam, firstTokenId, { from: creator })
          assert.fail('Expected to throw')
        } catch (e) {
          assert(true)
        }

        try {
          await this.token.transferFrom(ben, sam, firstTokenId, { from: sam })
          assert.fail('Expected to throw')
        } catch (e) {
          assert(true)
        }

        await this.token.transferFrom(ben, sam, firstTokenId, { from: ben })
        await this.token.transferFrom(sam, dave, firstTokenId, { from: sam })

        let result = await this.token.ownerOf.call(firstTokenId)
        assert.equal(result.valueOf(), dave)
      })
    })
  })

  describe('parcel price', function () {
    let tokenId = 10

    beforeEach(async function () {
      this.token = await Parcel.new({ from: creator })
    })

    describe('buy', function () {
      beforeEach(async function () {
        await this.token.mint(creator, tokenId, 0, 1, 2, 3, 4, 5, 0, { from: creator })
        await this.token.setPrice(tokenId, 1234)
      })

      it('buy', async function () {
        let owner = await this.token.ownerOf.call(tokenId)
        assert.equal(owner.valueOf(), creator)

        await this.token.buy(tokenId, { value: 1234, from: sam })

        let purchaser = await this.token.ownerOf.call(tokenId)
        assert.equal(purchaser.valueOf(), sam)

        let price = await this.token.getPrice.call(tokenId)
        assert.equal(price.valueOf(), 0)
      })

      it('shouldnt buy after transfer', async function () {
        await this.token.transferOwnership(dave, { from: creator })

        try {
          await this.token.buy(tokenId, { value: 1234, from: sam })
          assert.fail('Expected to throw')
        } catch (e) {
          assert(true)
        }

        let price = await this.token.getPrice.call(tokenId)
        assert.equal(price.valueOf(), 0)
      })

      it('shouldnt buy for 0', async function () {
        try {
          await this.token.buy(tokenId, { from: sam })
          assert.fail('Expected to throw')
        } catch (e) {
          assert(true)
        }
      })

      it('shouldnt buy for -1', async function () {
        try {
          await this.token.buy(tokenId, { value: -1, from: sam })
          assert.fail('Expected to throw')
        } catch (e) {
          assert(true)
        }
      })

      it('shouldnt buy for 100', async function () {
        try {
          await this.token.buy(tokenId, { value: 100, from: sam })
          assert.fail('Expected to throw')
        } catch (e) {
          assert(true)
        }
      })

      it('shouldnt buy for 5000', async function () {
        try {
          await this.token.buy(tokenId, { value: 5000, from: sam })
          assert.fail('Expected to throw')
        } catch (e) {
          assert(true)
        }
      })

      it('shouldnt buy twice', async function () {
        await this.token.buy(tokenId, { value: 1234, from: sam })

        try {
          await this.token.buy(tokenId, { value: 1234, from: sam })
          assert.fail('Expected to throw')
        } catch (e) {
          assert(true)
        }
      })

      it('shouldnt buy from two people', async function () {
        await this.token.buy(tokenId, { value: 1234, from: ben })

        try {
          await this.token.buy(tokenId, { value: 1234, from: sam })
          assert.fail('Expected to throw')
        } catch (e) {
          assert(true)
        }
      })

      it('set price after buy', async function () {
        await this.token.buy(tokenId, { value: 1234, from: sam })

        try {
          await this.token.setPrice(tokenId, 5000, { from: creator })
          assert.fail('Expected to throw')
        } catch (e) {
          assert(true)
        }

        try {
          await this.token.setPrice(tokenId, 5000, { from: sam })
          assert.fail('Expected to throw')
        } catch (e) {
          assert(true)
        }
      })
    })
  })
})

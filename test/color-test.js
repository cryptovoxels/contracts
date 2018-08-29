/* globals web3, artifacts, contract, beforeEach, describe, it, assert */

const Parcel = artifacts.require('Parcel')
const Color = artifacts.require('Color')

const addr = '0x79986aF15539de2db9A5086382daEdA917A9CF0C'

contract('mint test', async (accounts) => {
  const creator = accounts[0]

  let ben = accounts[1]
  let sam = accounts[2]
  let dave = accounts[3]

  it('should have name', async () => {
    let instance = await Color.deployed(addr)
    let name = await instance.name.call()
    assert.equal(name.valueOf(), 'Cryptovoxels Color')
  })

  it('should have symbol', async () => {
    let instance = await Color.deployed(addr)
    let name = await instance.symbol.call()
    assert.equal(name.valueOf(), 'COLR')
  })

  it('should have 0 tokens', async () => {
    let instance = await Color.deployed(addr)
    let balance = await instance.totalSupply.call()
    assert.equal(balance.valueOf(), 0)
  })

  it('should mint', async () => {
    let instance = await Color.deployed(addr)
    await instance.mint(ben, 1000)

    let balance = await instance.totalSupply.call()
    assert.equal(balance.valueOf(), 1000)

    balance = await instance.balanceOf.call(ben)
    assert.equal(balance.valueOf(), 1000)

    balance = await instance.balanceOf.call(dave)
    assert.equal(balance.valueOf(), 0)

    // Should not mint

    try {
      await instance.mint(sam, 1000, { from: sam })
      assert.fail('Expected to throw')
    } catch (e) {
      assert(true)
    }

    balance = await instance.totalSupply.call()
    assert.equal(balance.valueOf(), 1000)

    balance = await instance.balanceOf.call(sam)
    assert.equal(balance.valueOf(), 0)
  })

  it('should stake and unstake', async () => {
    let parcel = await Parcel.deployed()
    let addr = parcel.address

    let instance = await Color.new(addr)
    await instance.mint(ben, 1000)

    // Get bens balance
    let balance = await instance.balanceOf.call(ben)
    assert.equal(balance.valueOf(), 1000)

    // Mint parcel #7
    await parcel.mint(ben, 7, 11, 11, 11, 15, 15, 15, 0)

    // Stake
    await instance.stake(ben, 900, 7, { from: ben })

    // Supply is reduced
    balance = await instance.totalSupply.call()
    assert.equal(balance.valueOf(), 100)

    // Bens balance reduced
    balance = await instance.balanceOf.call(ben)
    assert.equal(balance.valueOf(), 100)

    let stake = await instance.getStake.call(7)
    assert.equal(stake.valueOf(), 900)

    // Withdraw
    await instance.withdraw(ben, 300, 7, { from: ben })

    // Supply increased
    balance = await instance.totalSupply.call()
    assert.equal(balance.valueOf(), 400)

    // Balance increased
    balance = await instance.balanceOf.call(ben)
    assert.equal(balance.valueOf(), 400)

    // Stake decreased
    stake = await instance.getStake.call(7)
    assert.equal(stake.valueOf(), 600)

    try {
      // not owner
      await instance.withdraw(sam, 10, 7, { from: sam })
      assert.fail('Expected to throw')
    } catch (e) {
      assert(true)
    }

    try {
      // not even creator
      await instance.withdraw(creator, 10, 7, { from: creator })
      assert.fail('Expected to throw')
    } catch (e) {
      assert(true)
    }

    try {
      // too much
      await instance.withdraw(ben, 1000, 7, { from: ben })
      assert.fail('Expected to throw')
    } catch (e) {
      assert(true)
    }

    // New owner of parcel can withdraw

    await parcel.transferFrom(ben, dave, 7, { from: ben })
    let result = await parcel.ownerOf.call(7)
    assert.equal(result.valueOf(), dave)

    await instance.withdraw(dave, 50, 7, { from: dave })
    balance = await instance.balanceOf.call(dave)
    assert.equal(balance.valueOf(), 50)
  })
})

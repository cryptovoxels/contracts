pragma solidity ^0.4.21;

import 'openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

import './Parcel.sol';

/**
 * @title Color token
 */
contract Color is StandardToken, Ownable {
  string public constant name = "Cryptovoxels Color";
  string public constant symbol = "COLR";
  uint8 public constant decimals = 0;

  event Mint(address indexed to, uint256 amount);
  event MintFinished();
  event Burn(address indexed burner, uint256 value);
  event Staked(address indexed to, uint256 value, uint256 _tokenId);
  event Withdrawn(address indexed to, uint256 value, uint256 _tokenId);

  Parcel parcelContract;

  bool public mintingFinished = false;
  mapping(uint256 => uint256) internal parcelBalance;
  address internal creator;

  modifier canMint() {
    require(!mintingFinished);
    _;
  }

  modifier hasMintPermission() {
    require(msg.sender == owner);
    _;
  }

  // 0x79986aF15539de2db9A5086382daEdA917A9CF0C
  constructor (address _parcelContract) public { 
    creator = msg.sender;
    owner = msg.sender;
    parcelContract = Parcel(_parcelContract); // 0x79986aF15539de2db9A5086382daEdA917A9CF0C);
  }

  function takeOwnership() public {
    require(msg.sender == creator);
    emit OwnershipTransferred(owner, creator);
    owner = creator;
  }

  function getStake(uint256 _parcel) public view returns (uint256) {
    return parcelBalance[_parcel];
  }

  function _burn(address _who, uint256 _value) internal {
    require(_value <= balances[_who]);
    // no need to require value <= totalSupply, since that would imply the
    // sender's balance is greater than the totalSupply, which *should* be an assertion failure

    balances[_who] = balances[_who].sub(_value);
    totalSupply_ = totalSupply_.sub(_value);
    emit Burn(_who, _value);
    emit Transfer(_who, address(0), _value);
  }

  /**
   * @dev Assigns an amount of tokens to a parcel
   * @param _from address The address which you want to send tokens from
   * @param _value uint256 The amount of token to be burned
   * @param _tokenId uint256 The token id of the parcel to send to
   */
  function stake(address _from, uint256 _value, uint256 _tokenId) public {
    require(_from == msg.sender);
    _burn(_from, _value);
    parcelBalance[_tokenId] += _value;
    emit Staked(_from, _value, _tokenId);
  }

  /**
   * @dev Withdraw tokens from a parcel
   * @param _to The address that will receive the tokens.
   * @param _amount The amount of tokens to transfer from parcel.
   * @param _tokenId The token id of the parcel to retrieve tokens from.
   * @return A boolean that indicates if the operation was successful.
   */
  function withdraw(
    address _to,
    uint256 _amount,
    uint256 _tokenId
  )
    public
    canMint
    returns (bool)
  {
    // The sender is the parcel owner
    address tokenOwner = parcelContract.ownerOf(_tokenId);
    require(msg.sender == tokenOwner);

    // The right balance exists
    require(parcelBalance[_tokenId] > 0);
    require(parcelBalance[_tokenId] >= _amount);

    // Decrement the balance
    parcelBalance[_tokenId] -= _amount;

    // Mint the tokens
    totalSupply_ = totalSupply_.add(_amount);
    balances[_to] = balances[_to].add(_amount);
    emit Mint(_to, _amount);
    emit Transfer(address(0), _to, _amount);
    emit Withdrawn(_to, _amount, _tokenId);
    return true;
  }

  /**
   * @dev Function to mint tokens
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(
    address _to,
    uint256 _amount
  )
    public
    hasMintPermission
    canMint
    returns (bool)
  {
    totalSupply_ = totalSupply_.add(_amount);
    balances[_to] = balances[_to].add(_amount);
    emit Mint(_to, _amount);
    emit Transfer(address(0), _to, _amount);
    return true;
  }

  /**
   * @dev Function to stop minting new tokens.
   * @return True if the operation was successful.
   */
  function finishMinting() public onlyOwner canMint returns (bool) {
    mintingFinished = true;
    emit MintFinished();
    return true;
  }
}

pragma solidity ^0.4.21;

import 'openzeppelin-solidity/contracts/token/ERC721/ERC721Token.sol';
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

library String {
  /*
    From https://ethereum.stackexchange.com/questions/10811/solidity-concatenate-uint-into-a-string
  */

  function appendUintToString(string inStr, uint v) internal pure returns (string str) {
      uint maxlength = 100;
      bytes memory reversed = new bytes(maxlength);
      uint i = 0;
      while (v != 0) {
          uint remainder = v % 10;
          v = v / 10;
          reversed[i++] = byte(48 + remainder);
      }
      bytes memory inStrb = bytes(inStr);
      bytes memory s = new bytes(inStrb.length + i);
      uint j;
      for (j = 0; j < inStrb.length; j++) {
          s[j] = inStrb[j];
      }
      for (j = 0; j < i; j++) {
          s[j + inStrb.length] = reversed[i - 1 - j];
      }
      str = string(s);
  }
}

contract Parcel is ERC721Token, Ownable {
  struct BoundingBox {
    int16 x1;
    int16 y1;
    int16 z1;
    int16 x2;
    int16 y2;
    int16 z2;
  }

  mapping(uint256 => BoundingBox) internal boundingBoxes;
  mapping(uint256 => string) internal contentURIs;
  mapping(uint256 => uint256) internal tokenPrice;
  address internal creator;

  event SetPrice(uint256 _tokenId, uint256 _price);

  constructor () public
    ERC721Token('Cryptovoxels Parcel', 'CVPA')
  { 
    creator = msg.sender;
  }

  function takeOwnership() public {
    require(msg.sender == creator);
    emit OwnershipTransferred(owner, creator);
    owner = creator;
  }

  function mint(address _to, uint256 _tokenId, int16 x1, int16 y1, int16 z1, int16 x2, int16 y2, int16 z2, uint256 _price) public onlyOwner {
    super._mint(_to, _tokenId);

    // Set bounds
    boundingBoxes[_tokenId] = BoundingBox(x1, y1, z1, x2, y2, z2);

    // Set price
    tokenPrice[_tokenId] = _price;

    if (_price > 0) {
      emit SetPrice(_tokenId, _price);
    }
  }

  function tokenURI(uint256 _tokenId) public view returns (string) {
    return (String.appendUintToString("https://www.cryptovoxels.com/p/", _tokenId));
  }

  function burn(uint256 _tokenId) public onlyOwner {
    super._burn(ownerOf(_tokenId), _tokenId);

    // Delete bounding box metadata
    delete boundingBoxes[_tokenId];

    // Delete content uri metadata
    if (bytes(contentURIs[_tokenId]).length != 0) {
      delete contentURIs[_tokenId];
    }
  }

  // Set the price of the token
  function setPrice (uint256 _tokenId, uint256 _price) public onlyOwner {
    // Token must exist
    require(exists(_tokenId));

    // Must be owned by the creator
    address tokenOwner = ownerOf(_tokenId);
    require(tokenOwner == creator);

    // Set price
    tokenPrice[_tokenId] = _price;

    emit SetPrice(_tokenId, _price);
  }

  // Get the price of the token
  function getPrice (uint256 _tokenId) public view returns (uint256) {
    require(exists(_tokenId));

    address tokenOwner = ownerOf(_tokenId);
    if (tokenOwner == creator) {
      return tokenPrice[_tokenId];
    } else {
      return 0;
    }
  }

  // Buy the token from the owner
  function buy (uint256 _tokenId) public payable {
    // Token must exist
    require(exists(_tokenId));

    // Token must be owned by creator
    address tokenOwner = ownerOf(_tokenId);
    require(tokenOwner == creator);

    // Price must be non zero
    uint256 price = tokenPrice[_tokenId];
    require(price > 0);
    require(msg.value == price);

    // Do transfer
    address _from = tokenOwner;
    address _to = msg.sender;

    // From #transferFrom
    clearApproval(_from, _tokenId);
    removeTokenFrom(_from, _tokenId);
    addTokenTo(_to, _tokenId);
    emit Transfer(tokenOwner, _to, _tokenId);

    // Check transfer worked
    require(checkAndCallSafeTransfer(_from, _to, _tokenId, ""));

    // Set price to 0
    tokenPrice[_tokenId] = 0;
  }

  // Get the bounding box (in metres) of this parcel
  function getBoundingBox(uint256 _tokenId) public view returns (int16, int16, int16, int16, int16, int16) {
    require(exists(_tokenId));

    return (
      boundingBoxes[_tokenId].x1, 
      boundingBoxes[_tokenId].y1, 
      boundingBoxes[_tokenId].z1,
      boundingBoxes[_tokenId].x2, 
      boundingBoxes[_tokenId].y2, 
      boundingBoxes[_tokenId].z2
    );
  }

  // Set a URL to load this scene from. Is normally empty for loading
  // from the cryptovoxels.com servers.
  function setContentURI(uint256 _tokenId, string _uri) public {
    require(exists(_tokenId));
    require(ownerOf(_tokenId) == msg.sender);
    contentURIs[_tokenId] = _uri;
  }

  function contentURI(uint256 _tokenId) public view returns (string) {
    require(exists(_tokenId));
    return contentURIs[_tokenId];
  }
}

pragma solidity ^0.4.23;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";

contract Name is ERC721Token {
    mapping(string => bool) internal canonicalNames;
    mapping(uint256 => string) internal lookupNames;
    mapping(string => uint256) internal names;
    uint256 internal topToken;

    constructor () public
        ERC721Token('Cryptovoxels Name', 'NAME')
    {
        topToken = 0;
    }

    /*
    From https://ethereum.stackexchange.com/questions/10811/solidity-concatenate-uint-into-a-string
    */

    function _appendUintToString(string inStr, uint v) internal pure returns (string str) {
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


    function _toLower(string str) internal pure returns (string) {
        bytes memory bStr = bytes(str);
        bytes memory bLower = new bytes(bStr.length);
        for (uint i = 0; i < bStr.length; i++) {
            // Uppercase character...
            if ((bStr[i] >= 65) && (bStr[i] <= 90)) {
                // So we add 32 to make it lowercase
                bLower[i] = bytes1(int(bStr[i]) + 32);
            } else {
                bLower[i] = bStr[i];
            }
        }
        return string(bLower);
    }

    function _isNameValid(string str) internal pure returns (bool){
        bytes memory b = bytes(str);
        if(b.length > 20) return false;
        if(b.length < 3) return false;

        for(uint i; i<b.length; i++){
            bytes1 char = b[i];

            if(
                !(char >= 0x30 && char <= 0x39) && //9-0
                !(char >= 0x41 && char <= 0x5A) && //A-Z
                !(char >= 0x61 && char <= 0x7A) && //a-z
                !(char == 95) && !(char == 45) // _ or -

            )
                return false;
        }

        char = b[0];

        // no punctuation at start
        if ((char == 95) || (char == 45)) {
            return false;
        }

        char = b[b.length - 1];

        // no punctuation at end
        if ((char == 95) || (char == 45)) {
            return false;
        }

        return true;
    }

    function mint(
        address _to,
        string _name
    ) public returns (uint256) {
        require(_isNameValid(_name));
        string memory canonical = _toLower(_name);

        require(canonicalNames[canonical] == false);

        // It's taken
        canonicalNames[canonical] = true;

        // Increment totalsupply
        topToken = topToken + 1;

        // Use this tokenId
        uint256 _tokenId = topToken;

        // Set capitalized name (cant be changed)
        names[_name] = _tokenId;

        // Set a lookup
        lookupNames[_tokenId] = _name;

        super._mint(_to, _tokenId);

        return _tokenId;
    }

    function tokenURI(uint256 _tokenId) public view returns (string) {
        return (_appendUintToString("https://www.cryptovoxels.com/n/", _tokenId));
    }

    function getName(uint256 _tokenId) public view returns (string) {
        return lookupNames[_tokenId];
    }
}

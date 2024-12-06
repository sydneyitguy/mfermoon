// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

/**
 * @title Moon
 * @author sebayaki.eth
 * @notice Claim MFERMOON token's trading royalties from MCV2_Bond for buy back & burn
 */
contract Moon {
    IMCV2_Bond public immutable bond;
    IERC20 public immutable mfer;
    IERC20 public immutable mferMoon;
    address public constant BURN_ADDRESS =
        address(0x000000000000000000000000000000000000dEaD);

    bool public isRestorable = true;
    address private constant RESTORER =
        0x980Cd99311f3b3264f5dfdCE33D204A8d6d492E4;

    struct History {
        uint40 timestamp;
        uint96 mferCollected;
        uint96 mferMoonBurned;
        address caller;
    }
    History[] public burnHistory;
    uint256 public totalMfermoonBurned;

    event Mooned(
        uint256 mferCollected,
        uint256 mferMoonBurned,
        address caller,
        uint40 timestamp
    );

    constructor() {
        bond = IMCV2_Bond(0xc5a076cad94176c2996B32d8466Be1cE757FAa27);
        mfer = IERC20(0xE3086852A4B125803C815a158249ae468A3254Ca);
        mferMoon = IERC20(0xF6F035883ef2536f0E262e592cF3ACfE59F0832B);

        // Max approve bond contract to spend mfer
        mfer.approve(address(bond), type(uint256).max);
    }

    /**
     * @notice Claim royalties and burn (callers will get 1% of accumulated for gas fee compensation)
     */
    function moon() external {
        bond.claimRoyalties(address(mfer));
        uint256 balance = mfer.balanceOf(address(this));

        // 1% of the amount burned will be sent to the caller as gas fee compensation
        uint256 callerCompensation = balance / 100;
        uint256 amountToBurn = balance - callerCompensation;
        uint256 tokensToMint = getTokensForReserve(amountToBurn);

        totalMfermoonBurned += tokensToMint;
        burnHistory.push(
            History({
                timestamp: uint40(block.timestamp),
                mferCollected: uint96(balance),
                mferMoonBurned: uint96(tokensToMint),
                caller: msg.sender
            })
        );

        // Buy-back MFERMOON tokens and burn them immediately
        // NOTE: maxReserveAmount can never exceed amountToBurn because the transaction is atomic
        // NOTE: +100 wei mfer to account for rounding errors
        bond.mint(
            address(mferMoon),
            tokensToMint,
            amountToBurn + 100,
            BURN_ADDRESS
        );

        // Update the caller compensation, adjusting for any rounding errors
        callerCompensation = mfer.balanceOf(address(this));
        if (!mfer.transfer(msg.sender, callerCompensation)) {
            revert("Failed to transfer mfer compensation");
        }

        emit Mooned(balance, tokensToMint, msg.sender, uint40(block.timestamp));
    }

    function getTokensForReserve(
        uint256 mferAmount
    ) public view returns (uint256) {
        require(mferAmount > 0, "mferAmount must be greater than 0");

        IMCV2_Bond.BondStep[] memory steps = bond.getSteps(address(mferMoon));
        uint256 currentSupply = mferMoon.totalSupply();

        // Calculate how many tokens we can mint with mferAmount
        uint256 reserveAmount = mferAmount;
        uint256 tokensToMint = 0;
        uint256 MULTI_FACTOR = 1e18; // Should match token decimals

        for (uint256 i = 0; i < steps.length; i++) {
            if (currentSupply >= steps[i].rangeTo) {
                continue; // skip until we reach the current step
            }
            if (reserveAmount == 0) break;

            uint256 tokensLeftInThisStep = steps[i].rangeTo - currentSupply;
            if (tokensLeftInThisStep == 0) continue;

            // Calculate max tokens we can mint in this step based on our reserve
            uint256 stepPrice = steps[i].price;
            uint256 maxTokensInThisStep = (reserveAmount * MULTI_FACTOR) /
                stepPrice;

            if (maxTokensInThisStep <= tokensLeftInThisStep) {
                tokensToMint += maxTokensInThisStep;
                reserveAmount = 0;
                break;
            }

            tokensToMint += tokensLeftInThisStep;
            reserveAmount -= Math.ceilDiv(
                tokensLeftInThisStep * stepPrice,
                MULTI_FACTOR
            );
        }

        require(tokensToMint > 0, "Cannot mint any tokens with this amount");

        return tokensToMint;
    }

    // MARK: - Utility functions

    function getStats()
        external
        view
        returns (uint256 pending, uint256 claimed)
    {
        (pending, claimed) = bond.getRoyaltyInfo(address(this), address(mfer));
    }

    function getHistoryCount() external view returns (uint256) {
        return burnHistory.length;
    }

    function getHistories(
        uint256 from,
        uint256 to
    ) external view returns (History[] memory) {
        unchecked {
            History[] memory histories = new History[](to - from + 1);
            for (uint256 i = from; i <= to; i++) {
                if (i >= burnHistory.length) return histories;

                histories[i - from] = burnHistory[i];
            }

            return histories;
        }
    }

    /**
     * @notice Emergency function for sending back the ownership of the mferMoon token to the RESTORER
     * @dev Only callable by the RESTORER when a critical bug found in the contract
     */
    function restoreOwnership() external {
        if (msg.sender != RESTORER || !isRestorable)
            revert("Permission denied");

        bond.updateBondCreator(address(mferMoon), RESTORER);
    }

    /**
     * @notice Disable the restorable mode, making it fully decentralized
     * @dev Once disabled, the restoreOwnership function won't work anymore
     */
    function disableRestorable() external {
        if (msg.sender != RESTORER) revert("Permission denied");
        isRestorable = false;
    }
}

interface IMCV2_Bond {
    struct BondStep {
        uint128 rangeTo;
        uint128 price;
    }

    function mint(
        address token,
        uint256 tokensToMint,
        uint256 maxReserveAmount,
        address receiver
    ) external returns (uint256);

    function claimRoyalties(address reserveToken) external;

    function getRoyaltyInfo(
        address wallet,
        address reserveToken
    ) external view returns (uint256, uint256);

    function getSteps(address token) external view returns (BondStep[] memory);

    function updateBondCreator(address token, address creator) external;
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);

    function transfer(address to, uint256 amount) external returns (bool);

    function approve(address spender, uint256 amount) external returns (bool);

    function totalSupply() external view returns (uint256);
}

library Math {
    function ceilDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        if (b == 0) {
            // Guarantee the same behavior as in a regular Solidity division.
            return a / b;
        }

        // (a + b - 1) / b can overflow on addition, so we distribute.
        return a == 0 ? 0 : (a - 1) / b + 1;
    }
}

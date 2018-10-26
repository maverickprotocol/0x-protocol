import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { constants } from '../constants';

export const orderUtils = {
    isOrderExpired(order: SignedOrder): boolean {
        return orderUtils.willOrderExpire(order, 0);
    },
    willOrderExpire(order: SignedOrder, secondsFromNow: number): boolean {
        const millisecondsInSecond = 1000;
        const currentUnixTimestampSec = new BigNumber(Date.now() / millisecondsInSecond).round();
        return order.expirationTimeSeconds.lessThan(currentUnixTimestampSec.plus(secondsFromNow));
    },
    isOpenOrder(order: SignedOrder): boolean {
        return order.takerAddress === constants.NULL_ADDRESS;
    },
    // given a remaining amount of takerAsset, calculate how much makerAsset is available
    getRemainingMakerAmount(order: SignedOrder, remainingTakerAmount: BigNumber): BigNumber {
        const remainingMakerAmount = remainingTakerAmount
            .times(order.makerAssetAmount)
            .div(order.takerAssetAmount)
            .floor();
        return remainingMakerAmount;
    },
    // given a desired amount of makerAsset, calculate how much takerAsset is required to fill that amount
    getTakerFillAmount(order: SignedOrder, makerFillAmount: BigNumber): BigNumber {
        // Round up because exchange rate favors Maker
        const takerFillAmount = makerFillAmount
            .mul(order.takerAssetAmount)
            .div(order.makerAssetAmount)
            .ceil();
        return takerFillAmount;
    },
    // given a desired amount of takerAsset to fill, calculate how much fee is required by the taker to fill that amount
    getTakerFeeAmount(order: SignedOrder, takerFillAmount: BigNumber): BigNumber {
        // Round down because Taker fee rate favors Taker
        const takerFeeAmount = takerFillAmount
            .mul(order.takerFee)
            .div(order.takerAssetAmount)
            .floor();
        return takerFeeAmount;
    },
    // given a desired amount of takerAsset to fill, calculate how much makerAsset will be filled
    getMakerFillAmount(order: SignedOrder, takerFillAmount: BigNumber): BigNumber {
        // Round down because exchange rate favors Maker
        const makerFillAmount = takerFillAmount
            .mul(order.makerAssetAmount)
            .div(order.takerAssetAmount)
            .floor();
        return makerFillAmount;
    },
    // given a desired amount of makerAsset, calculate how much fee is required by the maker to fill that amount
    getMakerFeeAmount(order: SignedOrder, makerFillAmount: BigNumber): BigNumber {
        // Round down because Maker fee rate favors Maker
        const makerFeeAmount = makerFillAmount
            .mul(order.makerFee)
            .div(order.makerAssetAmount)
            .floor();
        return makerFeeAmount;
    },
    // given a desired amount of ZRX from a fee order, calculate how much takerAsset is required to fill that amount
    // also calculate how much ZRX needs to be bought in order fill the desired amount + takerFee
    getTakerFillAmountForFeeOrder(order: SignedOrder, makerFillAmount: BigNumber): [BigNumber, BigNumber] {
        // For each unit of TakerAsset we buy (MakerAsset - TakerFee)
        const adjustedTakerFillAmount = makerFillAmount
            .mul(order.takerAssetAmount)
            .div(order.makerAssetAmount.sub(order.takerFee))
            .ceil();
        // The amount that we buy will be greater than makerFillAmount, since we buy some amount for fees.
        const adjustedMakerFillAmount = orderUtils.getMakerFillAmount(order, adjustedTakerFillAmount);
        return [adjustedTakerFillAmount, adjustedMakerFillAmount];
    },
};

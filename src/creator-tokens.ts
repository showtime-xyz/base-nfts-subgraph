import { Address, BigInt, Bytes, log, store } from "@graphprotocol/graph-ts";
import {
  Bought,
  CreatorToken as CreatorTokenContract,
  Sold,
  Transfer
} from "../generated/CreatorTokenFactory/CreatorToken";
import { CreatorToken, CreatorTokenNft } from "../generated/schema";

let NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

function loadNft(
  creatorToken: CreatorToken,
  ownerAddress: Address,
  tokenId: BigInt
): CreatorTokenNft {
  let id = creatorToken.id.toHexString() + "-" + tokenId.toString();

  let balance = CreatorTokenNft.load(id);

  if (!balance) {
    balance = new CreatorTokenNft(id);

    balance.creatorToken = creatorToken.id;
  }

  balance.tokenId = tokenId;
  balance.owner = ownerAddress;

  return balance;
}

function updateNextPricing(token: CreatorToken): void {
  let creatorTokenContract = CreatorTokenContract.bind(
    Address.fromBytes(token.id)
  );

  // Querying for price might revert if you're buying or selling but there's no supply

  let tryBuyPriceTuple = creatorTokenContract.try_priceToBuyNext();
  if (tryBuyPriceTuple.reverted) {
    token.nextBuyPrice = null;
  } else {
    let buyPriceTuple = tryBuyPriceTuple.value;
    token.nextBuyPrice = buyPriceTuple.value0
      .plus(buyPriceTuple.value1)
      .plus(buyPriceTuple.value2);
  }

  let trySellPriceTuple = creatorTokenContract.try_priceToSellNext1();

  if (trySellPriceTuple.reverted) {
    token.nextSellPrice = null;
  } else {
    let sellPriceTuple = trySellPriceTuple.value;
    token.nextSellPrice = sellPriceTuple.value0
      .minus(sellPriceTuple.value1)
      .minus(sellPriceTuple.value2);
  }

  token.save();
}

export function handleBought(event: Bought): void {
  if (!event.address) {
    log.critical("No contract address in tx {}", [
      event.transaction.hash.toHex()
    ]);

    return;
  }

  let owner = event.params.receiver;
  let tokenAddress = event.address;
  let token = CreatorToken.load(
    Bytes.fromHexString(tokenAddress.toHexString())
  );

  if (!token) {
    log.critical("Drop with address {} not found", [
      tokenAddress.toHexString()
    ]);

    return;
  }

  let tokenId = event.params.tokenId;
  let nft = loadNft(token, owner, tokenId);

  if (!nft) {
    return;
  }

  token.updatedAt = event.block.timestamp;
  token.totalCreatorEarningsUSDC = token.totalCreatorEarningsUSDC.plus(
    event.params.creatorFee
  );
  updateNextPricing(token);

  nft.updatedAt = event.block.timestamp;
  nft.save();
}

export function handleSold(event: Sold): void {
  if (!event.address) {
    log.critical("No contract address in tx {}", [
      event.transaction.hash.toHex()
    ]);

    return;
  }

  let tokenAddress = event.address;

  let token = CreatorToken.load(
    Bytes.fromHexString(tokenAddress.toHexString())
  );

  if (!token) {
    log.critical("Drop with address {} not found", [
      tokenAddress.toHexString()
    ]);

    return;
  }

  let tokenId = event.params.tokenId;
  let id = token.id.toHexString() + "-" + tokenId.toString();

  store.remove("CreatorTokenNft", id);

  token.updatedAt = event.block.timestamp;
  token.totalCreatorEarningsUSDC = token.totalCreatorEarningsUSDC.plus(
    event.params.creatorFee
  );
  updateNextPricing(token);
}

export function handleSent(event: Transfer): void {
  if (!event.address) {
    log.critical("No contract address in tx {}", [
      event.transaction.hash.toHex()
    ]);

    return;
  }

  let owner = event.params.to;
  let tokenAddress = event.address;

  if (owner.toHexString() == tokenAddress.toHexString()) {
    log.warning("Skipping because {} sent to token contract", [
      event.params.from.toHexString()
    ]);
    return;
  }

  let token = CreatorToken.load(
    Bytes.fromHexString(tokenAddress.toHexString())
  );

  if (!token) {
    log.critical("Drop with address {} not found", [
      tokenAddress.toHexString()
    ]);

    return;
  }

  if (owner.toHexString() == NULL_ADDRESS) {
    log.warning(
      "Deleting because {} sent to receiver {} which is the NULL ADDRESS",
      [event.params.from.toHexString(), NULL_ADDRESS]
    );

    let tokenId = event.params.tokenId;
    let id = token.id.toHexString() + "-" + tokenId.toString();

    store.remove("CreatorTokenNft", id);
    return;
  }

  // nfts are loaded by token id and creator token address
  // current owner does not invalidate the query
  let tokenId = event.params.tokenId;
  let nft = loadNft(token, owner, tokenId);

  if (!nft) {
    return;
  }

  nft.updatedAt = event.block.timestamp;
  nft.save();
  // pricing does not change when transferred
  // updates to pricing will be handled by the above handlers
  // updateNextPricing(token);
}

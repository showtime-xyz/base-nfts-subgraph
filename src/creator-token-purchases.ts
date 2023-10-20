import { Address, BigInt, Bytes, log, store } from "@graphprotocol/graph-ts";
import {
  Bought,
  CreatorToken as CreatorTokenContract,
  Sold
} from "../generated/CreatorTokenFactory/CreatorToken";
import { CreatorToken, CreatorTokenNft } from "../generated/schema";

function loadNft(
  creatorToken: CreatorToken,
  ownerAddress: Address,
  tokenId: BigInt
): CreatorTokenNft | null {
  let id = creatorToken.id.toHexString() + "-" + tokenId.toString();

  let balance = CreatorTokenNft.load(id);

  if (balance == null) {
    balance = new CreatorTokenNft(id);

    balance.creatorToken = creatorToken.id;
  }

  balance.tokenId = tokenId;
  balance.owner = ownerAddress;

  return balance;
}

function updateNextPricing(token: CreatorToken): void {
  let creatorTokenContract = CreatorTokenContract.bind(Address.fromBytes(token.id));

  // Querying for price might revert if you're buying or selling but there's no supply

  let tryBuyPriceTuple = creatorTokenContract.try_priceToBuyNext()
  if (tryBuyPriceTuple.reverted) {
    token.nextBuyPrice = BigInt.fromI32(-1);
  }

  else {
    let buyPriceTuple = tryBuyPriceTuple.value;
    token.nextBuyPrice = buyPriceTuple.value0.plus(buyPriceTuple.value1).plus(buyPriceTuple.value2);
  }

  let trySellPriceTuple = creatorTokenContract.try_priceToSellNext1();

  if (trySellPriceTuple.reverted) {
    token.nextSellPrice = BigInt.fromI32(-1);
  }

  else {
    let sellPriceTuple = trySellPriceTuple.value;
    token.nextSellPrice = sellPriceTuple.value0.plus(sellPriceTuple.value1).plus(sellPriceTuple.value2);
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

  if (token == null) {
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

  nft.updatedAt = event.block.timestamp;

  nft.save();

  updateNextPricing(token);
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

  if (token == null) {
    log.critical("Drop with address {} not found", [
      tokenAddress.toHexString()
    ]);

    return;
  }

  let tokenId = event.params.tokenId;
  let id = token.id.toHexString() + "-" + tokenId.toString();

  store.remove("CreatorTokenNft", id);

  updateNextPricing(token);
}

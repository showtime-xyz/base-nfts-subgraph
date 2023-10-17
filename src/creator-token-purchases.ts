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

  balance.owner = ownerAddress;

  return balance;
}

function updateNextPricing(token: CreatorToken): void {
  let creatorTokenContract = CreatorTokenContract.bind(token.id);

  let sellRes = creatorTokenContract.priceToSellNext1();
  let buyRes = creatorTokenContract.priceToBuyNext();

  token.nextSellPrice = sellRes.value0
    .plus(sellRes.value1)
    .plus(sellRes.value2);

  token.nextBuyPrice = buyRes.value0.plus(buyRes.value1).plus(buyRes.value2);
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

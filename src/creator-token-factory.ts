import { CreatorToken as CreatorTokenContract } from "../generated/CreatorTokenFactory/CreatorToken";
import { CreatorTokenDeployed } from "../generated/CreatorTokenFactory/CreatorTokenFactory";
import { CreatorToken } from "../generated/schema";
import { CreatorTokenNft as CreatorTokenNftTemplate } from "../generated/templates";
import { BigInt } from "@graphprotocol/graph-ts";


export default function handleCreatorToken(event: CreatorTokenDeployed): void {
  let tokenAddress = event.params.creatorToken;
  let creatorToken = CreatorTokenContract.bind(tokenAddress);

  let entity = new CreatorToken(tokenAddress);
  entity.creator = event.params.config.creator;
  entity.createdAt = event.block.timestamp;
  entity.updatedAt = event.block.timestamp;
  entity.totalCreatorEarningsUSDC = BigInt.zero();

  entity.name = creatorToken.name();
  entity.metadataUrl = creatorToken.tokenURI(BigInt.zero());

  // Querying for price might revert if you're buying or selling but there's no supply

  let tryBuyPriceTuple = creatorToken.try_priceToBuyNext()
  if (tryBuyPriceTuple.reverted) {
    entity.nextBuyPrice = null;
  }

  else {
    let buyPriceTuple = tryBuyPriceTuple.value;
    entity.nextBuyPrice = buyPriceTuple.value0.plus(buyPriceTuple.value1).plus(buyPriceTuple.value2);
  }

  let trySellPriceTuple = creatorToken.try_priceToSellNext1();

  if (trySellPriceTuple.reverted) {
    entity.nextSellPrice = null;
  }

  else {
    let sellPriceTuple = trySellPriceTuple.value;
    entity.nextSellPrice = sellPriceTuple.value0.minus(sellPriceTuple.value1).minus(sellPriceTuple.value2);
  }

  entity.save();

  CreatorTokenNftTemplate.create(tokenAddress);
}

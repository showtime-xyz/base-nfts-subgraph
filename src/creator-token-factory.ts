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

  entity.name = creatorToken.name();
  entity.metadataUrl = creatorToken.tokenURI(BigInt.zero());

  let buyPriceTuple = creatorToken.priceToBuyNext()
  let sellPriceTuple = creatorToken.priceToSellNext1()

  entity.nextBuyPrice = buyPriceTuple.value0.plus(buyPriceTuple.value1).plus(buyPriceTuple.value2);
  entity.nextSellPrice = sellPriceTuple.value0.plus(sellPriceTuple.value1).plus(sellPriceTuple.value2);

  entity.save();

  CreatorTokenNftTemplate.create(tokenAddress);
}

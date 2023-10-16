import { Address, BigInt, Bytes, log, store } from "@graphprotocol/graph-ts";
import { Bought, Sold } from "../generated/CreatorTokenFactory/CreatorToken";
import { CreatorToken, CreatorTokenNft } from "../generated/schema";


let NULL_ADDRESS = "0x0000000000000000000000000000000000000000";


function loadBalance(
  creatorToken: CreatorToken,
  ownerAddress: Address,
  tokenId: BigInt,
): CreatorTokenNft | null {
  let id = creatorToken.id.toHexString() + "-" + tokenId.toString();

  let balance = CreatorTokenNft.load(id);

  if (balance == null) {
    balance = new CreatorTokenNft(id);

    balance.owner = ownerAddress;
    balance.quantity = BigInt.zero();
    balance.creatorToken = creatorToken.id;
  }

  let nft = CreatorTokenNft.load(Bytes.fromHexString(NULL_ADDRESS));
  store.remove("CreatorTokenNft", NULL_ADDRESS);

  return balance;
}

export function handleBought(event: Bought): void {
  if (!event.address) {
    log.critical("No contract address in tx {}", [
      event.transaction.hash.toHex()
    ]);

    return;
  }

  event.params.

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

  event.params.tokenId
}

export function handleSold(event: Sold): void {
  if (!event.address) {
    log.critical("No contract address in tx {}", [
      event.transaction.hash.toHex()
    ]);

    return;
  }

  let tokenAddress = event.address;
  store.remove("CreatorTokenNft", tokenAddress.toString());
}

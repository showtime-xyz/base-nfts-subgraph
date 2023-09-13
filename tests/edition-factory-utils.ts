import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import { CreatedEdition } from "../generated/EditionFactory/EditionFactory"

export function createCreatedEditionEvent(
  editionId: BigInt,
  creator: Address,
  editionContractAddress: Address,
  tags: string
): CreatedEdition {
  let createdEditionEvent = changetype<CreatedEdition>(newMockEvent())

  createdEditionEvent.parameters = new Array()

  createdEditionEvent.parameters.push(
    new ethereum.EventParam(
      "editionId",
      ethereum.Value.fromUnsignedBigInt(editionId)
    )
  )
  createdEditionEvent.parameters.push(
    new ethereum.EventParam("creator", ethereum.Value.fromAddress(creator))
  )
  createdEditionEvent.parameters.push(
    new ethereum.EventParam(
      "editionContractAddress",
      ethereum.Value.fromAddress(editionContractAddress)
    )
  )
  createdEditionEvent.parameters.push(
    new ethereum.EventParam("tags", ethereum.Value.fromString(tags))
  )

  return createdEditionEvent
}

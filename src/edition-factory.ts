import { CreatedEdition as CreatedEditionEvent } from "../generated/EditionFactory/EditionFactory"
import { CreatedEdition } from "../generated/schema"

export function handleCreatedEdition(event: CreatedEditionEvent): void {
  let entity = new CreatedEdition(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.editionId = event.params.editionId
  entity.creator = event.params.creator
  entity.editionContractAddress = event.params.editionContractAddress
  entity.tags = event.params.tags

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

import { Edition } from "../generated/EditionFactory/Edition";
import { CreatedEdition as CreatedEditionEvent } from "../generated/EditionFactory/EditionFactory";
import { FreeNFTDrop } from "../generated/schema";
import { Edition as EditionTemplate } from "../generated/templates";

export default function handleCreatedEdition(event: CreatedEditionEvent): void {
  let collectionAddress = event.params.editionContractAddress;
  let edition = Edition.bind(collectionAddress);

  let entity = new FreeNFTDrop(collectionAddress);
  entity.createdAt = event.block.timestamp;
  entity.creator = event.params.creator;
  entity.editionSize = edition.editionSize();
  entity.name = edition.name();
  entity.description = edition.description();
  entity.imageUrl = edition.imageUrl();
  entity.animationUrl = edition.animationUrl();
  entity.deadline = edition.endOfMintPeriod();
  entity.save();

  EditionTemplate.create(collectionAddress);
}

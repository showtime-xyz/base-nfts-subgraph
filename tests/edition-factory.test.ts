import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { CreatedEdition } from "../generated/schema"
import { CreatedEdition as CreatedEditionEvent } from "../generated/EditionFactory/EditionFactory"
import { handleCreatedEdition } from "../src/edition-factory"
import { createCreatedEditionEvent } from "./edition-factory-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let editionId = BigInt.fromI32(234)
    let creator = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let editionContractAddress = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let tags = "Example string value"
    let newCreatedEditionEvent = createCreatedEditionEvent(
      editionId,
      creator,
      editionContractAddress,
      tags
    )
    handleCreatedEdition(newCreatedEditionEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("CreatedEdition created and stored", () => {
    assert.entityCount("CreatedEdition", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "CreatedEdition",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "editionId",
      "234"
    )
    assert.fieldEquals(
      "CreatedEdition",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "creator",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "CreatedEdition",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "editionContractAddress",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "CreatedEdition",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "tags",
      "Example string value"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})

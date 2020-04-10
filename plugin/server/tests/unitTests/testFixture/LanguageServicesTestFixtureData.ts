

const decisinGraphDocs = 
[
	{
uri : "dg1.dg",
text : 
`[#import dogs: dogs.dg]
[#import cats: cats.dg]

[>q-order< ask:
  {text: Do the dogs first?}
  {answers:
      {yes: [call: dogs>dog][call: cats>cat]}
      {no:  [call: cats>cat][call:dogs>dog]}
  }
]
[todo: specify mice]
[>sec-frogs< section:
  {title: Add frogs}
  [todo: Add frog 1]
  [todo: Add frog 2]
]
[set: Rice=Full]
[end]		
`
	}
]


const policySpaceDocs = 
[
	{
uri : "ps1.pspace",
text : 
`atomic_slot1 [atomic_slot_desc.]: one of
	slotval1 [desc],
	slotval2 [desc],
	slotval3 [desc].
	
atomic_slot2 [atomic_slot_desc.]: one of
	slotval1 [desc],
	slotval2 [desc],
	slotval3 [desc].

aggregate_slot [aggregate_slot_desc]: some of
	slotval1 [desc],
	slotval2 [desc],
	slotval3 [desc].

compound_slot [compound_slot_desc]: consists of atomic_slot, atomic_slot2, aggregate_slot.
`
	}
]

const policyValueInferenceDocs = 
[
	{
uri : "vi1.vi",
text : 
`[DataTag: support
	[ Encrypt=None;   DUA_AM=Implied -> Blue    ]
	[ Encrypt=Quick;  DUA_AM=Click   -> Yellow  ]
	[ Encrypt=Hard;   DUA_AM=Click   -> Green   ]
	[ Encrypt=Double; DUA_AM=Type    -> Red     ]
	[ Encrypt=Double; DUA_AM=Sign    -> Crimson ]
  ]
`
	}
]

export { decisinGraphDocs, policySpaceDocs , policyValueInferenceDocs};

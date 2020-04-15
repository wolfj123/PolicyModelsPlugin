const data = 
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
  [set: 
	DataTags/Mid1/Bottom1=b1a; 
	DataTags/Mid2/Mid1+=
	{b2b, b1a}]
]
[set: Rice=Full]
[end]		
`
}
,{
uri : "dg2.dg",
text : 
`[#import dg : file.dg]
[>findme< ask:
{text: Do the data contain health information?}
{answers:
	{yes: [ >yo< call: dg>findme]}}]
`		
},
//***************** POLICYSPACE *****************/
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
},
//*****************VALUE INFERENCE *****************/
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

export { data };

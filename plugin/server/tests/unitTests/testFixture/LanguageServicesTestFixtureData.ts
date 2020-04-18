const data = 
[

{
uri : "dg1.dg",
text : 
`[#import dogs: dogs.dg]
[#import cats: cats.dg]

[>findme< ask:
  {text: Do the dogs first?}
  {answers:
      {yes: [call: dogs>dog][call: cats>cat]}
	  {no:  [call: cats>cat][call:dogs>dog]}
  }
]
[call: findme]
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

compound_slot [compound_slot_desc]: consists of atomic_slot1, atomic_slot2, aggregate_slot.
`
},
//***************** VALUE INFERENCE *****************/
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

//***************** WOKRSPACE 1 *****************/
,{
uri : "ps_ws_1.pspace",
text : 
`atomic_slot1 [atomic_slot_desc.]: one of
	atomic_slot1_val1 [desc],
	atomic_slot1_val2 [desc],
	atomic_slot1_val3 [desc].
	
atomic_slot2 [atomic_slot_desc.]: one of
	atomic_slot2_val1 [desc],
	atomic_slot2_val2 [desc],
	atomic_slot2_val3 [desc].

aggregate_slot [aggregate_slot_desc]: some of
	aggregate_slot_slotval1 [desc],
	aggregate_slot_slotval2 [desc],
	aggregate_slot_slotval3 [desc].

compound_slot [compound_slot_desc]: consists of atomic_slot1, atomic_slot2, aggregate_slot.
`	
}
,{
uri : "dg1_ws_1.dg",
text : 
`
[#import dg2 : dg2_ws_1.dg]
[#import dg3 : dg3_ws_1.dg]

[>n1<  call : n2]
[>n2<  call : dg2>n2]
[>n3<  call : dg3>n2]
[>n4< set: 
	compound_slot/atomic_slot1 = atomic_slot1_val1; 
	compound_slot/aggregate_slot += {aggregate_slot_slotval1, aggregate_slot_slotval2}]
[>n_end< end]

`	
}
,{
uri : "dg2_ws_1.dg",
text : 
`
[#import dg1 : dg1_ws_1.dg]
[#import dg3 : dg3_ws_1.dg]

[>n1< when:
	{atomic_slot1=atomic_slot1_val1: [call: dg1>n1]}
	{else:
	  [call:n_end]
	}
  ]
[>n_end< end]
`	
}

,{
uri : "dg3_ws_1.dg",
text : 
`
[#import dg1 : dg1_ws_1.dg]
[#import dg2 : dg2_ws_1.dg]

[>n1< when:
	{atomic_slot1=atomic_slot1_val1: [call: dg2>n1]}
	{else:
	  [call:n_end]
	}
  ]
[>n_end< end]
`	
}

,{
uri : "vi_ws_1.vi",
text : 
`
[DataTag: atomic_slot1
	[atomic_slot2=atomic_slot1_val2; aggregate_slot+=aggregate_slot_slotval1 -> atomic_slot1_val1 ]]
`	
}
]

export { data };

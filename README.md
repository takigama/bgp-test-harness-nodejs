
BGP Daemon in Node.js
=====================

simple implementation of the bgp protocol stack - set your ip address and your AS and it'll publish a
number of prefixes.

Has a little cli where you can control route publication, type "h" or "?" to get help in the cli.

Currently only supports talking to a single peer (in reality). However, it can connect multiple peers, and
keep the connection alive, but it will only publish routes to the last connected peer.

effectively ignores any routes published to it, keeps track of how many routes its published, but doesnt
keep track of the details. Uses a table of randomally generated AS paths for AS path publication

Any suggestions on improvement are welcome.





How to Use It
=============

An example of it being used again a juniper route reflector, needs to bind to the bgp port (179) so needs
to start with root privileges or needs the nodejs binary given low port privileges if your on linux - though
generally sudo would be the safer option otherwise any nodejs code run by anyone can bind low ports. 


		
	mymachine:nodejs-bgp-test-harness takigama$ sudo node bgpfake.js 
	Usage: /Users/paulr/Documents/workspace/nodejs-bgp-test-harness/bgpfake.js MyAS [[IP:AS] ....]
	mymachine:nodejs-bgp-test-harness takigama$ sudo node bgpfake.js 4321 10.10.40.1:5432
	(4321) idle:0/0 (1.0.0) > 
	(4321) idle:0/0 (1.0.0) > ?
	Help - (x) is default settings
	        h[elp],? - this help menu
	        a - toggle use of private ranges (false)
	        k x - automatically pause after x route publications, 0 to disable
	        l - toggle per-peer updates (true). Each connected peer gets same next-hop and AS Path when this is false
	        m - toggle between random next hop and my ip as next hop, randomise last octet (false)
	        n a b c - change timers, a is time between publications in ms (20), b is number of updates per publication (40), c is number of routes per update (100)
	        p - pause sending route updates to connected peers
	        r - reset IP range back to beginning
	        s - status
	        t - toggles between random and sequential addressing (sequential)
	        u - start sending route updates to connected peers
	        q[uit],exit,end - Quit
	Prompt layout
	        (AS/IP) state:connections/updates-sent (current-route)
	(4321) idle:0/0 (1.0.0) > s
	---- Status ----
	Currently idle
	Private ranges: false
	Sequential publication: true
	Per-Peer updates: true
	Random NextHop: false
	Number of connected peers: 0
	Number of routes published: 0
	Update timers: 50ms between publications, 3 updates per publication, 41 routes per update
	My ASN: 4321
	Current IP (for sequential publications): 1.0.0.0/24
	AS path table size: 1048576
	Automatically pause off
	No currently connected peers
	(4321) connected:1/0 (1.0.0) > LOG: connection from 10.10.41.20
	(4321) connected:1/0 (1.0.0) > LOG: keepalive from remote (10.10.41.20)
	(4321) ready:1/0 (1.0.0) > LOG: keepalive from remote (10.10.41.20)
	(4321) ready:1/0 (1.0.0) > LOG: update from remote (10.10.41.20)
	(4321) connected:2/0 (1.0.0) > LOG: connection from 10.10.40.20
	(4321) connected:2/0 (1.0.0) > LOG: keepalive from remote (10.10.40.20)
	(4321) ready:2/0 (1.0.0) > LOG: update from remote (10.10.40.20)
	(4321) ready:2/0 (1.0.0) > s
	---- Status ----
	Currently ready
	Private ranges: false
	Sequential publication: true
	Per-Peer updates: true
	Random NextHop: false
	Number of connected peers: 2
	Number of routes published: 0
	Update timers: 50ms between publications, 3 updates per publication, 41 routes per update
	My ASN: 4321
	Current IP (for sequential publications): 1.0.0.0/24
	AS path table size: 1048576
	Automatically pause off
	Connections from: 
	        10.10.41.20 connected to 10.10.41.1
	        10.10.40.20 connected to 10.10.40.1
	(4321) ready:2/0 (1.0.0) > n 50 125 72
	(4321) ready:2/0 (1.0.0) > k 500000
	(4321) ready:2/0 (1.0.0) > LOG: keepalive from remote (10.10.41.20)
	LOG: autopause enabled. Will pause after another 50000 updates, which is 50000 more routes - note that this isnt necessarily exact as if many routes per update are sent then it'll do a complete update which may exceed this
	(4321) ready:2/0 (1.0.0) > LOG: keepalive from remote (10.10.40.20)
	(4321) ready:2/0 (1.0.0) > u
	LOG: Sending updates to peer
	(4321) sending:2/0 (1.0.0) > LOG: keepalive from remote (10.10.41.20)
	(4321) sending:2/18000 (1.70.150) > 
	(4321) sending:2/261000 (5.3.135) > 
	(4321) stopping:2/504000 (8.191.120) > LOG: Stopping publications


and on the route reflector:

	root> show route summary    
	Autonomous system number: 1234
	Router ID: 5.5.5.5
	
	inet.0: 504011 destinations, 1007939 routes (504011 active, 0 holddown, 0 hidden)
	              Direct:      5 routes,      5 active
	               Local:      5 routes,      5 active
	                 BGP: 1007928 routes, 504000 active
	              Static:      1 routes,      1 active
	
	root> show route 6.5.4.3 
	
	inet.0: 504011 destinations, 1007939 routes (504011 active, 0 holddown, 0 hidden)
	+ = Active Route, - = Last Active, * = Both
	
	6.5.4.0/24         *[BGP/170] 00:01:44, localpref 100
	                      AS path: 4321 24286 17548 4072 I, validation-state: unverified
	                    > to 10.10.41.1 via em1.0
	                    [BGP/170] 00:01:43, localpref 100
	                      AS path: 5432 5780 10536 20048 9072 17120 I, validation-state: unverified
	                    > to 10.10.40.1 via em0.0





BUGS
====
 - When something causes output to the console, the CLI looses where the cursor was - FIXED
 - Multi peer support doesnt deal with a dead connection - FIXED


TODO
====
 - other family support (inet6, inet-vpn, etc)
 - add support for different subnet lengths (currently only does /24)
 - add random communities.
 - add a daemon mode where it just auto publishes based on some parameters when someone connects
 - add route withdrawal
 - add ability to fake connection problems and/or send notifies back to peers
 - add ability to choose start range

 
 

 
 
DONE
====
 - Multiple peer support - but all see same updates and same remote AS
 - multiple local AS/IP support (i.e. pretend to be more then one bgp peer)
 - per-peer updates (each peer gets a different AS path and if random next-hops are on, a different ip address for the next hop);
 - add support for changing the way batches of routes are published
 	- time between route publications
 	- number of routes pushed into each published NLRI
 	- number of published NLRI's between publications
 - Add a cli
   - change next hop on the fly
   - start/stop publication
   - change between sequential and random ip publication
   - add a status
   - auto update cli with a readline type prompt
 - Change how routes are published, no longer tracked, just keeps track of number being published
 - Allow connection from multiple peers


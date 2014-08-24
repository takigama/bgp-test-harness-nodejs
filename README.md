
BGP Daemon in Node.js
=====================

simple implementation of the bgp protocol stack - set your AS (and even your peer-ip address AS) and it'll publish a
number of prefixes.

Has a little cli where you can control route publication, type "h" or "?" to get help in the cli.

Supports multiple peers, and each peer can be shown a different AS - if the machine where bgpfake.js is running has multiple ip addresses

effectively ignores any routes published to it, keeps track of how many routes its published, but doesn't
keep track of the details. Uses a table of randomly generated AS paths for AS path publication

Any suggestions on improvement are welcome.





How to Use It
=============

An example of it being used again a juniper route reflector, needs to bind to the bgp port (179) so needs
to start with root privileges or needs the nodejs binary given low port privileges if your on linux - though
generally sudo would be the safer option otherwise any nodejs code run by anyone can bind low ports. 

Startup is fairly simple:

	sudo node bgpfake.js 65555
	
you can also do:

	sudo node bgpfake.js 65555 1.2.3.4:1234 2.3.4.5:2345 3.4.5.6:3456
	
which tells bgpfake.js to use 65555 as the "normal" AS, but whenever it gets a
connection on an address of 1.2.3.4 use AS 1234, use AS 2345 when connected via
2.3.4.5 and use 3456 when connected via 3.4.5.6. For use in the case where its
running on a machine with multiple ip addresses.


		
	mymachine:nodejs-bgp-test-harness takigama$ sudo node bgpfake.js 
	Usage: /Users/paulr/Documents/workspace/nodejs-bgp-test-harness/bgpfake.js MyAS [[IP:AS] ....]
	mymachine:nodejs-bgp-test-harness takigama$ sudo node bgpfake.js sudo node bgpfake.js 4321 10.10.40.1:5432 192.168.58.1:6543 192.168.59.1:7654
	(4321) idle:0/0 (1.0.0) > 
	(4321) idle:0/0 (1.0.0) > 
	(4321) connected:1/0 (1.0.0) > LOG: connection from 10.10.41.20
	(4321) connected:1/0 (1.0.0) > LOG: keepalive from remote (10.10.41.20)
	(4321) ready:1/0 (1.0.0) > LOG: keepalive from remote (10.10.41.20)
	(4321) ready:1/0 (1.0.0) > LOG: update from remote (10.10.41.20)
	(4321) connected:2/0 (1.0.0) > LOG: connection from 10.10.40.20
	(4321) connected:2/0 (1.0.0) > LOG: keepalive from remote (10.10.40.20)
	(4321) ready:2/0 (1.0.0) > LOG: update from remote (10.10.40.20)
	(4321) ready:2/0 (1.0.0) > LOG: keepalive from remote (10.10.41.20)
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
			My ASN: 4321 - (10.10.40.1 is AS 5432) (192.168.58.1 is AS 6543) (192.168.59.1 is AS 7654)
			Current IP (for sequential publications): 1.0.0.0/24
			AS path table size: 1048576
			Automatically pause off
			Connections from: 
			        10.10.41.20 connected to 10.10.41.1 (local AS:4321)
			        10.10.40.20 connected to 10.10.40.1 (local AS:5432)
			        
	(4321) ready:2/0 (1.0.0) > ?
	
			Help - (x) is default settings
			
	        h[elp],? - this help menu
	        a - toggle use of private ranges (false)
	        k x - automatically pause after x route publications, 0 to disable
	        l - toggle per-peer updates (true). Each connected peer gets same next-hop and AS Path when this is false - if random addressing, each peer gets different destinations also
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
	        
	(4321) ready:2/0 (1.0.0) > LOG: keepalive from remote (10.10.40.20)
	(4321) ready:2/0 (1.0.0) > LOG: keepalive from remote (10.10.41.20)
	(4321) ready:2/0 (1.0.0) > LOG: keepalive from remote (10.10.40.20)
	(4321) ready:2/0 (1.0.0) > LOG: keepalive from remote (10.10.41.20)
	(4321) ready:2/0 (1.0.0) > n 50 12 61
	(4321) ready:2/0 (1.0.0) > k 500000
	LOG: autopause enabled. Will pause after another 500000 updates, which is 500000 more routes - note that this isnt necessarily exact as if many routes per update are sent then it'll do a complete update which may exceed this
	(4321) ready:2/0 (1.0.0) > LOG: keepalive from remote (10.10.40.20)
	(4321) ready:2/0 (1.0.0) > LOG: keepalive from remote (10.10.41.20)
	(4321) ready:2/0 (1.0.0) > u
	LOG: Sending updates to peer
	(4321) sending:2/0 (1.0.0) > 
	(4321) sending:2/10248 (1.40.48) > 
	(4321) sending:2/25620 (1.100.120) > 
	(4321) sending:2/128100 (2.247.90) > LOG: keepalive from remote (10.10.40.20)
	(4321) sending:2/213744 (4.73.54) > LOG: keepalive from remote (10.10.41.20)
	(4321) sending:2/363072 (6.148.207) > 
	(4321) sending:2/434808 (7.175.33) > 
	(4321) sending:2/447984 (7.226.204) > LOG: keepalive from remote (10.10.40.20)
	(4321) stopping:2/500688 (8.178.123) > LOG: Stopping publications
	(4321) ready:2/500688 (8.178.123) > LOG: keepalive from remote (10.10.41.20)
	(4321) ready:2/500688 (8.178.123) > 




and on the route reflector:

	root@vrr-1> show route summary    
	Autonomous system number: 1234
	Router ID: 10.10.40.20
	
	inet.0: 500699 destinations, 1001204 routes (500699 active, 0 holddown, 0 hidden)
	              Direct:      5 routes,      5 active
	               Local:      5 routes,      5 active
	                 BGP: 1001193 routes, 500688 active
	              Static:      1 routes,      1 active

	root@vrr-1> show route 6.5.4.3 
	
	inet.0: 500699 destinations, 1001204 routes (500699 active, 0 holddown, 0 hidden)
	+ = Active Route, - = Last Active, * = Both
	
	6.5.4.0/24         *[BGP/170] 00:01:56, localpref 100
	                      AS path: 5432 18070 5116 9208 17392 3760 I, validation-state: unverified
	                    > to 10.10.40.1 via em0.0
	                    [BGP/170] 00:01:55, localpref 100
	                      AS path: 4321 2450 3876 6728 12432 23840 I, validation-state: unverified
	                    > to 10.10.41.1 via em1.0





BUGS
====
 - Something I cant quite figure out is causing a random EPIPE error
 - Lots of input validation is missing
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
 - save settings into somewhere appropriate (perhaps, but probably not), i.e. ~/.bgpfakerc

 
 

 
 
DONE
====
 - Multiple peer support - but all see same updates and same remote AS
 - multiple local AS/IP support (i.e. pretend to be more then one bgp peer when connected by different addresses)
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


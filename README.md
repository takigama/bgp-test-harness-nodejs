
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

		nodejs-bgp-test-harness takigama$ sudo node bgpfake.js 4321 10.10.40.1
		(4321/10.10.40.1) idle:0/0 (1.0.0) > 
		(4321/10.10.40.1) idle:0/0 (1.0.0) > s
		---- Status ----
		Currently idle
		Private ranges: false
		Sequential publication: true
		Random NextHop: false
		Number of connected peers: 0
		Number of routes published: 0
		My IP address: 10.10.40.1
		Update timers: 20ms between publications, 40 updates per publication, 100 routes per update
		My ASN: 4321
		Current IP (for sequential publications): 1.0.00/24
		AS path table size: 1048576
		Automatically pause off
		No currently connected peers
		(4321/10.10.40.1) connected:1/0 (1.0.0) > LOG: connection from 10.10.40.20
		(4321/10.10.40.1) connected:1/0 (1.0.0) > LOG: keepalive from remote (10.10.40.20)
		(4321/10.10.40.1) ready:1/0 (1.0.0) > LOG: update from remote (10.10.40.20)
		(4321/10.10.40.1) ready:1/0 (1.0.0) > LOG: keepalive from remote (10.10.40.20)
		(4321/10.10.40.1) ready:1/0 (1.0.0) > LOG: update from remote (10.10.40.20)
		(4321/10.10.40.1) ready:1/0 (1.0.0) >
		(4321/10.10.40.1) idle:0/0 (1.0.0) > ?
		Help - (x) is default settings
		        h[elp],? - this help menu
		        u - start sending route updates to connected peers
		        p - pause sending route updates to connected peers
		        a - toggle use of private ranges (false)
		        n a b c - change timers, a is time between publications in ms (20), b is number of updates per publication (40), c is number of routes per update (100)
		        m - toggle between random next hop and my ip as next hop, randomise last octet (false)
		        s - status
		        t - toggles between random and sequential addressing (sequential)
		        r - reset IP range back to beginning
		        k x - automatically pause after x route publications, 0 to disable
		        q[uit],exit,end - Quit
		Prompt layout
		        (AS/IP) state:connections/updates-sent (current-route)
		 
		(4321/10.10.40.1) ready:1/0 (1.0.0) > u
		LOG: Sending updates to peer
		(4321/10.10.40.1) sending:1/0 (1.0.0) > 
		(4321/10.10.40.1) sending:1/148000 (3.70.100) > 
		(4321/10.10.40.1) sending:1/212000 (4.66.95) > 
		(4321/10.10.40.1) sending:1/296000 (5.140.200) > 
		(4321/10.10.40.1) sending:1/384000 (6.230.225) > 
		(4321/10.10.40.1) sending:1/484000 (8.113.10) > p
		(4321/10.10.40.1) stopping:1/564000 (9.171.195) > LOG: Stopping publications
		(4321/10.10.40.1) ready:1/564000 (9.171.195) > 
		
		
		And on the route reflector:
		root> show route summary 
		Autonomous system number: 1234
		Router ID: 10.10.40.20
		
		inet.0: 564011 destinations, 564011 routes (564011 active, 0 holddown, 0 hidden)
		              Direct:      5 routes,      5 active
		               Local:      5 routes,      5 active
		                 BGP: 564000 routes, 564000 active
		              Static:      1 routes,      1 active
		





BUGS
====
 - When something causes output to the console, the CLI looses where the cursor was.
 - Multi peer support doesnt deal with a dead connection


TODO
====
 - other family support (inet6, inet-vpn, etc)
 - add support for changing the way batches of routes are published
 	- time between route publications
 	- number of routes pushed into each published NLRI
 	- number of published NLRI's between publications
 - add support for different subnet lengths (currently only does /24)
 - add random communities.
 - multiple local AS/IP support (i.e. pretend to be more then one bgp peer)

 
 

 
 
DONE
====
 - Multiple peer support - but all see same updates and same remote AS
 - per-peer updates (each peer gets a different AS path and if random next-hops are on, a different ip address for the next hop);
 - Add a cli
   - change next hop on the fly
   - start/stop publication
   - change between sequential and random ip publication
   - add a status
   - auto update cli with a readline type prompt
 - Change how routes are published, no longer tracked, just keeps track of number being published
 - Allow connection from multiple peers


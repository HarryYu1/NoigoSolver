/*
Code by Ostryperet
Noigo Solver
3/25/2024

*/




//Creating a priority queue for dijikstra
class PriorityQueue {
    constructor() {
        this.items = [];
    }
    
    //enqueue with priority
    enqueue(element, priority) {
        const queueElement = { element, priority };
        let added = false;
        for (let i = 0; i < this.items.length; i++) {
            if (queueElement.priority < this.items[i].priority) {
                this.items.splice(i, 0, queueElement);
                added = true;
                break;
            }
        }
        if (!added) {
            this.items.push(queueElement);
        }
    }

    //dequeue highest priority
    dequeue() {
        if (this.isEmpty()) {
            return null;
        }
        return this.items.shift().element;
    }

    isEmpty() {
        return this.items.length === 0;
    }
}

//define a graph with adjacency list that includes directions
class Graph {
    constructor() {
        this.nodes = {};
    }

    addNode(node) {
        if (!this.hasNode(node)) {
            this.nodes[node] = [];
            return true; // Node added successfully
        }
        return false; // Node already exists
    }

    hasNode(node) { //checks if nodes has property of a node
        return this.nodes.hasOwnProperty(node);
    }

    addEdge(node, direction, adjacentNode, weight) {
        this.nodes[node].push({ direction, node: adjacentNode, weight }); //dictionary with definition: each node has a list of dicts.
    }
 
    
    //function for dijikstra's algorithm
    //
    dijkstra(startNode, endNode) {
        const distances = {};
        const previous = {};
        const priorityQueue = new PriorityQueue();

        // Initialize distances, if start then 0 else infinity
        for (const node in this.nodes) {
            distances[node] = node === startNode ? 0 : Infinity;
            previous[node] = null;
            priorityQueue.enqueue(node, distances[node]);
        }
        //while there are unvisited nodes
        while (!priorityQueue.isEmpty()) {
            //visit node
            const currentNode = priorityQueue.dequeue();
            
            //if it's the end node finish and get directions
            if (currentNode === endNode) {
                const path = [];
                const directions = [];
                let current = endNode;
                while (current !== null) {
                    path.unshift(current); //add to beginning of path list
                    if (previous[current]) { // if exists previous node
                        for (const edge of this.nodes[previous[current]]) { 
                            if (edge.node === current) { //if the edge of the previous is current
                                directions.unshift(edge.direction); //add that direction of the directions
                                break;
                            }
                        }
                    }
                    current = previous[current];
                }
                return { distance: distances[endNode], path, directions };
            }

            if (currentNode || distances[currentNode] !== Infinity) { 
                for (const edge of this.nodes[currentNode]) { // for each edge
                    const distance = distances[currentNode] + edge.weight;//start from beginning, compare edges
                    if (distance < distances[edge.node]) { //only add if better path
                        distances[edge.node] = distance;  //the total distance from source
                        previous[edge.node] = currentNode; //the previous of the next node is current
                        priorityQueue.enqueue(edge.node, distance); //now need to visit next
                    }
                }
            }
        }
        

        return null;
    }
    
  	displayGraph() {
        let graphString = '';

        for (const node in this.nodes) {
            graphString += `${node}: `;
            const edges = this.nodes[node];
            for (const edge of edges) {
                graphString += `(${edge.direction} -> ${edge.node} : ${edge.weight}) `;
            }
            graphString += '\n';
        }

        return graphString;
    }
}

   
//initiallize graph
const graph = new Graph();

var unvisited = [];//new Stack()
gwc.userdata.found = false;
var visited = [];
var firstid = String(gwc.gmcp.data.room.id);

//starting at initial room
graph.addNode(firstid);
//push north and west rooms to unvisited list
unvisited.push([firstid, "north"]);
unvisited.push([firstid, "west"]);
unvisited.push([firstid, "east"]);
visited.push(firstid);


//**************************************
//   HELPER FUNCTIONS
//**************************************

function wait(milliseconds) {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}


gwc.userdata.noigoloop = setInterval(noigo_iteration, 3000); 

//ok I can't do a loop because gmcp does a thing with room id....
function noigo_iteration(){
  if (gwc.userdata.found == false && unvisited.length > 0) {

      firstid = gwc.gmcp.data.room.id; //where we are now
    
      gwc.output.append(graph.displayGraph()); //show the graph thus far
      
      var check = []; //what room we are trying to  "check"
      
    
      var found_unvisited_adjacent = false;
      //first tries adjacent rooms
      for (let i = 0; i < unvisited.length && !found_unvisited_adjacent; i++){
          if (unvisited[i][0] == firstid) //oh hey there's an adjacent room
          {
            gwc.output.append('Found adjacent room: ' + unvisited[i][0] + ' ' + unvisited[i][1]);
          	gwc.connection.send(unvisited[i][1]);
            found_unvisited_adjacent = true;
            check = [firstid, unvisited[i][1]]; //room to check
			unvisited.splice(i, 1);
          }
      }
    
      //no adjacent? if not then dijkstra to next on the list
      if (!found_unvisited_adjacent){
          check = unvisited.pop(); //next room to visit
          var result = graph.dijkstra(firstid, check[0]); //the first is the room, the second is the direction
            //navigate
            for (let i = 0; i < result.directions.length; i++){  //directions to the room
                gwc.connection.send(result.directions[i]);
            } 
            gwc.connection.send(check[1]); //final direction on top of room
            for (let i = 0; i < result.path.length; i++) {  //print for debug purposes
                  if (i > 0) {
                    gwc.output.append("Go " + result.directions[i - 1] + " to " + result.path[i]);
                  } 
                  else {
                  gwc.output.append(result.path[i]);
                  }
            }
        
       		gwc.output.append("trying to visit: " + check[0] + " " + check[1]);  //where we are going

        	gwc.output.append(result.directions);
      }


	  console.log('Before wait');
		wait(600).then(() => {    //wait to nullify dumb gmcp lag
    		var currentid = String(gwc.gmcp.data.room.id);//set current id
            graph.addNode(currentid); //add the room to the graph OK I HATE THIS IT SCREWED UP MY THING FOR SO LONG
            graph.addEdge(check[0], check[1], currentid, 1); //edge from previous to current
            gwc.output.append("current room:" + currentid);    

            if (gwc.gmcp.data.room.exits.includes("in")){
                  gwc.userdata.found = true;
            }
			
          	//tries to get nearest unvisited
            else if (visited.includes(currentid)) {
                gwc.output.append("visited this room!");

            }
            else{
                //continue dfs, add all the unvisited edges to be visited
                visited.push(currentid);
                for (let i = 0; i < gwc.gmcp.data.room.exits.length; i++){
                  	if (gwc.gmcp.data.room.exits[i] != "northeast" &&
                        gwc.gmcp.data.room.exits[i] != "southeast"  &&
                        gwc.gmcp.data.room.exits[i] != "southwest"  &&
                  		gwc.gmcp.data.room.exits[i] != "northwest"){
                		unvisited.push([currentid, gwc.gmcp.data.room.exits[i]]);}
                }

            }
          gwc.output.append("Unvisited nodes: " + unvisited);
	  });

  }
}






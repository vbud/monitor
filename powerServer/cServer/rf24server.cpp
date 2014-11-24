/*
** server.c -- a stream socket server demo
*/

#include <RF24/RF24.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <errno.h>
#include <string.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netdb.h>
#include <arpa/inet.h>
#include <sys/wait.h>
#include <signal.h>
#include <iostream>
#include <time.h>
#include <stdio.h>
#include <pthread.h>
#include <assert.h>

#define PORT "3490"  // the port users will be connecting to

#define BACKLOG 10   // how many pending connections queue will hold

#define MAXDATASIZE 1024 // max number of bytes we can get at once 
using namespace std;

RF24 radio(RPI_V2_GPIO_P1_15, RPI_V2_GPIO_P1_24, BCM2835_SPI_SPEED_8MHZ);
struct InfoSample
{ float volts,amps,power;
};
bool listening = 0;

// Radio pipe addresses for the 2 nodes to communicate.
const uint8_t pipes[][6] = {"1Node","2Node"};
//const uint64_t pipes[2] = { 0xABCDABCD71LL, 0x544d52687CLL };

long int startTime = (long int) time(NULL);

/*void WriteLogFile(const char* szString)
{
	long int nowTime = (long int) time(NULL);
	unsigned long elapsedTime = nowTime - startTime;
 
	FILE* pFile = fopen("logFile.txt", "a");
	fprintf(pFile, "%s\n",szString);
	fclose(pFile);
 
}*/

/*void queryArduino(){
	radio.stopListening();
	long int nowTime = (long int) time(NULL);
	unsigned long elapsedTime = nowTime - startTime;
	//printf("Requesting data, t=%lu.  ",elapsedTime);
	fflush(stdout);

	bool ok = radio.write( &elapsedTime, sizeof(unsigned long) );

	if (!ok){
		//printf("failed.\n");
	}
	radio.startListening();
}*/
/*bool getRadioResponse(struct InfoSample* infoSample){
	// Wait here until we get a response, or timeout
	unsigned long started_waiting_at = millis();
	bool timeout = false;
	while ( ! radio.available() && ! timeout ) {
		if (millis() - started_waiting_at > 1000 )
			timeout = true;
		sleep(0.1);
	}

	// Describe the results
	if ( timeout ){
		return 1;
	}else{
		//printf("sizeof(InfoSample)= %i", sizeof(infoSample));  
		while(radio.available()){
			radio.read( infoSample, sizeof(struct InfoSample) );
		}
	}
	return 0;
}*/
void setupRadio(){
	// Setup and configure rf radio
	radio.begin();

	// optionally, increase the delay between retries & # of retries
	radio.setRetries(15,15);
	// Dump the configuration of the rf unit for debugging
	//radio.printDetails();

	radio.openWritingPipe(pipes[0]);
	radio.openReadingPipe(1,pipes[1]);	
}

void sigchld_handler(int s)
{
    while(waitpid(-1, NULL, WNOHANG) > 0);
}

// get sockaddr, IPv4 or IPv6:
void *get_in_addr(struct sockaddr *sa)
{
    if (sa->sa_family == AF_INET) {
        return &(((struct sockaddr_in*)sa)->sin_addr);
    }

    return &(((struct sockaddr_in6*)sa)->sin6_addr);
}
void *radioToNodeRelay(void  *arg){
	int sockCon = (int)arg;
	InfoSample infoSample;
	char buf[MAXDATASIZE];
	while(1){
		if (listening && radio.available()){
			radio.read( &infoSample, sizeof(struct InfoSample) );
			printf("RF24server: volts='%f',amps='%f',power='%f'\n",
				infoSample.volts,infoSample.amps,infoSample.power);
			fflush(stdout);
			sprintf(buf,"%f,%f,%f",
				infoSample.volts,infoSample.amps,infoSample.power);

			if (send(sockCon, buf, strlen(buf), MSG_NOSIGNAL) == -1){
				printf("RF24server: cannot send to node\n");
				fflush(stdout);
				//perror("send");
				break;
			}
		}
		usleep(10000);// 1 second = 1,000,000 microseconds
	}
	//printf("RF24server: exiting radioToNodeRelay\n");
	return NULL;
}
void *nodeToRadioRelay(void *arg){
	int sockCon = (int)arg;
	int numbytes = 0;
	char buf[MAXDATASIZE];
	int outgoingMsg = 10;
	bool delivery = false;
	int count = 0;
	while((numbytes = recv(sockCon, buf, MAXDATASIZE-1, 0)) > 0){
		buf[numbytes] = '\0';
		printf("RF24server: received '%s'\n",buf);
		fflush(stdout);
		outgoingMsg = atoi(buf);
		radio.stopListening();
		listening = 0;
		//printf("RF24server: stopped listening\n");
		count=0;
		do {
			delivery = radio.write( &outgoingMsg, 4);              // Send the final one back.      
			if (delivery){
				printf("RF24server: sent message successfully\n");  
			}else{
				printf("RF24server: send failed!\n");  
			}
			fflush(stdout);
			usleep(500000);// 1 second = 1,000,000 microseconds
			count++;
		}while(!delivery && count < 10);
		//fflush(stdout);		
		radio.startListening();
		listening = 1;
	}; // numbytes=0 when client disconnected*/
	return NULL;
}
void handleConnection(int sockCon, struct sockaddr_storage* their_addr, char* s){
	// get ip of the client
	inet_ntop(their_addr->ss_family,
		get_in_addr((struct sockaddr *) their_addr), s, INET6_ADDRSTRLEN);
	printf("RF24server: got connection from %s\n", s);
	fflush(stdout);
	pthread_t thread1, thread2;
	// create separate threads
	pthread_create( &thread1, 0, radioToNodeRelay, (void*)sockCon);
	pthread_create( &thread2, 0, nodeToRadioRelay, (void*)sockCon);
	// wait here until thread2 is done.
	//pthread_join( thread1, NULL);
	pthread_join( thread2, NULL);
	// stop thread1
	pthread_cancel(thread1);
	return;
}

int main(void)
{
	setbuf(stdout,NULL);
	setupRadio();
	// for socket
    int socketId = 0, sockCon = 0;// listen on sock_fd, new connection on sockCon
    struct addrinfo hints, *servinfo, *p;
    struct sockaddr_storage their_addr; // connector's address information
    socklen_t sin_size;
    struct sigaction sa;
    int yes=1;
    char s[INET6_ADDRSTRLEN];
    int rv;
	//char buf[MAXDATASIZE];

    memset(&hints, 0, sizeof hints);
    hints.ai_family = AF_UNSPEC;
    hints.ai_socktype = SOCK_STREAM;
    hints.ai_flags = AI_PASSIVE; // use my IP


    if ((rv = getaddrinfo(NULL, PORT, &hints, &servinfo)) != 0) {
        fprintf(stderr, "getaddrinfo: %s\n", gai_strerror(rv));
		fflush(stdout);
        return 1;
    }
	

    // loop through all the results and bind to the first we can
    for(p = servinfo; p != NULL; p = p->ai_next) {
        if ((socketId = socket(p->ai_family, p->ai_socktype,
                p->ai_protocol)) == -1) {
            perror("RF24server: socket");
            continue;
        }

        if (setsockopt(socketId, SOL_SOCKET, SO_REUSEADDR, &yes,
                sizeof(int)) == -1) {
            perror("setsockopt");
            exit(1);
        }

        if (bind(socketId, p->ai_addr, p->ai_addrlen) == -1) {
            close(socketId);
            perror("RF24server: bind");
            continue;
        }

        break;
    }

    if (p == NULL)  {
        fprintf(stderr, "RF24server: failed to bind\n");
        //return 2;
		exit(2);
    }

    freeaddrinfo(servinfo); // all done with this structure

    if (listen(socketId, BACKLOG) == -1) {
        perror("listen");
        exit(1);
    }

    sa.sa_handler = sigchld_handler; // reap all dead processes
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = SA_RESTART;
    if (sigaction(SIGCHLD, &sa, NULL) == -1) {
        perror("sigaction");
        exit(1);
    }

    
	fprintf(stdout, "RF24server: listening on port "PORT".\n");
	fflush(stdout);
	sleep(3);
	radio.startListening();
	listening = 1;

    while(sockCon != -1) {  // main accept() loop
		fprintf(stdout, "RF24server: waiting for connections...\n");
		fflush(stdout);
        sin_size = sizeof their_addr;
        sockCon = accept(socketId, (struct sockaddr *)&their_addr, &sin_size);
        printf("RF24server: sockCon=%i\n",sockCon);
		if (sockCon == -1) {
            perror("accept");
			continue;
        }
		handleConnection(sockCon, &their_addr, s);
		printf("RF24server: %s has disconnected.\n", s);
		fflush(stdout);
    }


    return 0;
}

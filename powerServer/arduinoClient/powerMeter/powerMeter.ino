// BEGIN RADIO SETUP
#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>
#include <printf.h>
#include "datastructures.h"
//
// Hardware configuration: Set up nRF24L01 radio on SPI bus plus pins 9 & 10 
RF24 radio(9,10);
int const powerRelayPin = 3;
byte addresses[][6] = {"1Node","2Node"};


// END RADIO SETUP


#include<stdlib.h>

/* this is the frequency that the load will be polled during sampling. */
const int frequency = 2400;
/* this is the number of values in one sample. */
const int sampleSize = 1200;
const int calibrationSize = 300;

/* the arduino's analog sensor returns a value between 0 to 1023 units. */
/* with zero load voltage, we get a reading of 469units. this is the offset.*/
float centerVolt = 468;
/* with zero load amperage, we get a reading of 510units. this is the offset.*/
float centerAmp = 510; 
/* measuring 166.34V peak with my multimeter, we see a peak of 823; 1.143v_rms at A0.
	823 - 468 = 341
	166.34V / 355bits = 0.46856 volts per unit
*/
const float voltPerUnit = 0.49607f;
/* measuring 2.348A peak with my multimeter, we see a peak of 559.
	559 - 510 = 49
	2.348A / 49units = 0.047916 volts per unit
*/
const float ampPerUnit = 0.049878f;

String str1 = "";

int power = 0;
int index = 0;
unsigned long  period = 1000000/frequency;

char buffer[10];

float v,a,p;
float vMax, aMax, vMin, aMin;
float vAverage, aAverage, pAverage;
unsigned long periodTracker = 0;
bool timeout = false;
long incommingMsg; // Variable for the received timestamp


InfoSample infoSample;

void setup() {
	Serial.begin(9600);
	str1.reserve(256);
	pinMode(powerRelayPin, OUTPUT);
	// BEGIN RADIO SETUP
	printf_begin();
	printf("\n\rRF24/examples/GettingStarted/\n\r");
	

	// Setup and configure rf radio
	radio.begin();                          // Start up the radio
	radio.setAutoAck(1);                    // Ensure autoACK is enabled
	radio.setRetries(15,15);                // Max delay between retries & number of retries
	radio.openWritingPipe(addresses[1]);
	radio.openReadingPipe(1,addresses[0]);

	radio.startListening();                 // Start listening
	//radio.stopListening();  
	//radio.printDetails();                   // Dump the configuration of the rf unit for debugging
	// END RADIO SETUP
}
bool delivery = false;
bool sendRadioMessage(InfoSample* message){
	//printf("sizeof(InfoSample)= %i", sizeof(infoSample));  
	radio.stopListening();   
	delivery = radio.write( message, sizeof(infoSample));              // Send the final one back.      
	radio.startListening();
	if (delivery){
		printf("sent message successfully\n");  
	}else{
		printf("send failed!\n");  
	}
	
	return delivery;
}

void checkRadio(){
	if( radio.available()){
		while (radio.available()) {                                   // While there is data ready
			//printf("sizeof(long) = %i \n", sizeof(long) ); 
			radio.read( &incommingMsg, sizeof(long) );             // Get the payload
			printf("Received message %lu \n\r", incommingMsg);  
		}    
		switch(incommingMsg){
			case 10 :
				digitalWrite(powerRelayPin, LOW);
				printf("set pin low\n");  
				break;
			case 11 :
				digitalWrite(powerRelayPin, HIGH);
				printf("set pin high\n");
				break;
		}
		/*
		delivery = sendRadioMessage(&infoSample);
		if(delivery==false){
			delay(200);
			sendRadioMessage(&infoSample);
		}*/
	}
}



void calibrate(){
	vMax = 0;
	aMax = 0;
	vMin = 1023;
	aMin = 1023;
	vAverage = 0;
	aAverage = 0;
	periodTracker = micros();
	index = 0;
	while(index < calibrationSize){
		if ( (periodTracker + period) < micros() ) {
			periodTracker+=period;
			
			v = analogRead(A0);
			a = analogRead(A1);
			// add to average voltage and amps
			vAverage += v;
			aAverage += a;
			// keep track of min and max
			if (v > vMax){
				vMax = v;
			} else if (v < vMin){
				vMin = v;
			}
			if (a > aMax){
				aMax = a;
			} else if (a < aMin){
				aMin = a;
			}	
			index++;
		}else if (micros() < periodTracker){
			periodTracker = micros();
		}
	}
	// divide by the total to get the average
	vAverage /= sampleSize;
	aAverage /= sampleSize;
	centerVolt = (vMax + vMin)/2;
	centerAmp = (aMax + aMin)/2;
}

void getSample(){
	periodTracker = micros();
	index = 0;
	pAverage = 0;
	while(index < sampleSize){
		if ( (periodTracker + period) < micros() ) {
			periodTracker+=period;
			
			v = analogRead(A0);
			a = analogRead(A1);
					
			// convert bits to volts and amps.
			v = (v - centerVolt) * voltPerUnit;
			a = (a - centerAmp) * ampPerUnit;
			// calculate the power
			p = v*a;
			// add to the running total
			pAverage += p;
			// this this sample value is ready
			index++;
		}else if (micros() < periodTracker){
			periodTracker = micros();
		}
	}	
	// divide by the total to get the average
	pAverage /= sampleSize;
	
	// set precision for power
	String pString = dtostrf(pAverage, 5, 1, buffer);
	
	infoSample.volts = (vMax-centerVolt)*voltPerUnit *0.707;
	//infoSample.amps = (aMax-centerAmp)*ampPerUnit*0.707;
	infoSample.amps = pAverage / infoSample.volts;	
	infoSample.power = pAverage;
		
	// output to USB
	str1 = 		
		"\npower = " + pString +
		" watts, volts = " + String(infoSample.volts)+
		" V, amps = " + String(infoSample.amps);
		//" A, vMax = " + String(vMax)+
		//", vMin = " + String(vMin)+
		//", aMax = " + String(aMax)+
		//", aMin = " + String(aMin)+
		//", vAverage = " + String(vAverage)+
		//", aAverage = " + String(aAverage)+
		//", centerAmp = " + String(centerAmp);
		
		
	Serial.println(str1);


}

void loop() {
	calibrate();
	getSample();
	//delay(10);
	checkRadio();
	sendRadioMessage(&infoSample);
}



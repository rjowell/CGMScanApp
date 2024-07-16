import { Image, StyleSheet, Platform, Button, View, Text, NativeEventEmitter, NativeModules } from 'react-native';
import {useState} from 'react';
import BleManager, {Peripheral} from 'react-native-ble-manager';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  
  const [deviceNames,setDeviceNames] = useState<string[]>([]);
  const bleManagerEmitter = new NativeEventEmitter(NativeModules.BleManager);
  bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', (peripheral)=>{handleDiscoverDevice(peripheral);})
  BleManager.start();

  function handleDiscoverDevice(peripheral: Peripheral)
  {
    
    if(peripheral.name)
      {
        setDeviceNames([...deviceNames,peripheral.name]);
      }  
      
    
  }

  return (
    <View>
     <Text>----</Text>
    <Text>----</Text>
    <Text>-----</Text>
    <Text>----</Text>
    <Text>----</Text>
    <Text>-----</Text>
    
    
   
    <Button onPress={()=>{console.log("Pressed");BleManager.scan([],180,false);}} title="Scan"/>
    {deviceNames.map((item)=>{
      return(<Button title={item} onPress={()=>{alert("Do you want to connect to "+item+"?")}}/>);
    })}
    
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});

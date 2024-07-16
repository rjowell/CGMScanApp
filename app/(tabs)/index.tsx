import { Image, StyleSheet, Platform, Button, View, Text, NativeEventEmitter, NativeModules, Alert } from 'react-native';
import {useState} from 'react';
import BleManager, {Peripheral} from 'react-native-ble-manager';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  
  const [deviceNames,setDeviceNames] = useState<string[][]>([]);
  const bleManagerEmitter = new NativeEventEmitter(NativeModules.BleManager);
  enum SensorStatus {
    //未知 Unknown
    Unknown,
    //监测结束 End of monitoring
    Monitored,
    //监测中 Monitoring
    Monitoring,
    //数据初始化中 Data initialization
    DataInitialization,
    //传感器初始化中 Sensor initialization
    SensorInitialization,
  }

  enum messages
  {
    TAG_TIME_SYNCHRONIZATION="Time Synchronization",
    TAG_BIND_DEVICE = "Bind the device",
    TAG_REQUEST_WORK_LOG = "Request a site diary",
    TAG_REQUEST_WORK_STATUS_AND_ALARM = "Request working status and alarms",
    TAG_GET_FIRMWARE_VERSION = "Obtain the firmware version",
    TAG_REQUEST_BLOOD_SUGAR_CURRENT_DATA = "Request blood glucose current data",
    TAG_REQUEST_DEVICE_RUNNING_TIME = "Request device uptime",
    TAG_REQUEST_BATTERY_RUNNING_TIME = "Request battery runtime",
    TAG_REQUEST_DEVICE_BATTERY_VOLTAGE = "Request a device battery voltage",
    TAG_REQUEST_REFERENCE = "Request a reference",
    TAG_REQUEST_DISCONNECT = "Request to end connection"
  }

  class SGV
  {
    value:number;
    time:number;

    constructor(value:number,time:number)
    {
      this.value = value;
      this.time = time;
    }
  }


  class SGVs
  {
    sgvMap: Map<number,SGV> = new Map<number,SGV>();
    total:number = 0;
  }
  bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', (peripheral)=>{handleDiscoverDevice(peripheral);})
  BleManager.start();

  function connectToDevice(deviceId: string)
  {
    
    console.log("The Device ID Is "+deviceId);
    
    BleManager.connect(deviceId).then(()=>{
      console.log("Device "+deviceId+" Connected");
      BleManager.retrieveServices(deviceId,["need Service ID Here"]).then((services)=>{
        console.log(services.characteristics);
      }).catch((error)=>{console.log("Retrieve Error "+error)});
    }).catch((error)=>{console.log("Connect Error "+error)});
  }

  function handleDiscoverDevice(peripheral: Peripheral)
  {
    
    if(peripheral.name)
      {
        setDeviceNames([...deviceNames,[peripheral.id,peripheral.name]]);
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
    {deviceNames.map((item,i)=>{
      return(<Button title={item[1]} onPress={()=>{Alert.alert("Question","Do you want to connect to "+item[1]+" "+i+"?",[{text:"Yes",onPress:()=>{console.log(item[0]);connectToDevice(item[0])}},{text:"No"}])}}/>);
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

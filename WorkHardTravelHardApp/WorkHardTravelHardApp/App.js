import { StatusBar } from "expo-status-bar";
import { React, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable as PressableRaw,
  TextInput,
  Dimensions,
  ScrollView,
  TouchableWithoutFeedback,
  Alert,
  Platform,
} from "react-native";
// https://www.npmjs.com/package/@react-native-async-storage/async-storage
// expo install @react-native-async-storage/async-storage
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "./colors";
import { Fontisto } from "@expo/vector-icons";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import prompt from "@powerdesigninc/react-native-prompt";

const STORAGE_ToDos_KEY = "@toDos";
const LAST_CATEGORY_KEY = "@lastCategory";
const { width: SCREEN_WIDTH } = Dimensions.get("window"); // object안에 있는 width를 가져오고 이걸 SCREEN_WIDTH라 칭함

function Pressable(props) {
  return (
    <PressableRaw
      onPress={props.onPress}
      hitSlop={props.hitSlop}
      style={({ pressed }) => [
        props.style || {},
        { opacity: pressed ? 0.5 : 1 },
      ]}
    >
      {props.children}
    </PressableRaw>
  );
}

export default function App() {
  const [working, setWorking] = useState(true);
  const [text, setText] = useState("");
  const [completed, setCompleted] = useState(false);
  const [lastCategory, setlastCategory] = useState();
  const [toDos, setToDos] = useState({}); // hashMap

  useEffect(() => {
    // only first rendering -> Load ToDoList
    lastCategoryStart();
    loadToDos();
  }, []);

  const travel = () => {
    setWorking(false);
    saveLastCategory("travel");
    setText("");
  };
  const work = () => {
    setWorking(true);
    saveLastCategory("work");
    setText("");
  };

  // payload = Data Transmitted
  const onChangeText = (payload) => {
    setText(payload);
    //console.log(payload);
  };

  const onChangeCompleted = (key) => {
    const newToDos = { ...toDos };
    newToDos[key].completed = !newToDos[key].completed;
    setToDos(newToDos);
    saveToDos(newToDos);
  };

  const modifyToDo = (key) => {
    prompt("Text to modify", null, (input) => {
      if (input === null) {
        return;
      }
      const newToDos = { ...toDos };
      newToDos[key].text = input;
      setToDos(newToDos);
      saveToDos(newToDos);
    });
  };

  const deleteToDo = (key) => {
    if (Platform.OS === "web") {
      const ok = confirm("Do you want to delete this To Do?");
      if (ok) {
        const newToDos = { ...toDos };
        delete newToDos[key];
        setToDos(newToDos);
        saveToDos(newToDos);
      }
    } else {
      Alert.alert("Delete To Do", "Are you sure ?", [
        { text: "Cancel" },
        {
          text: "I'm Sure",
          style: "destructive",
          onPress: () => {
            const newToDos = { ...toDos };
            delete newToDos[key];
            setToDos(newToDos);
            saveToDos(newToDos);
          },
        },
      ]);
    }
  };

  const saveLastCategory = async (toSave) => {
    await AsyncStorage.setItem(LAST_CATEGORY_KEY, JSON.stringify(toSave));
  };

  const saveToDos = async (toSave) => {
    await AsyncStorage.setItem(STORAGE_ToDos_KEY, JSON.stringify(toSave));
  };

  const loadToDos = async () => {
    const st = await AsyncStorage.getItem(STORAGE_ToDos_KEY);
    st == null ? null : setToDos(JSON.parse(st));
  };

  const lastCategoryStart = async () => {
    const st = await AsyncStorage.getItem(LAST_CATEGORY_KEY);
    st == null
      ? null
      : JSON.parse(st) === "work"
      ? setWorking(true)
      : setWorking(false);
  };

  const addToDo = async () => {
    if (text === "") {
      return;
    }
    const newToDos = { ...toDos, [Date.now()]: { text, working, completed } };
    setToDos(newToDos);
    await saveToDos(newToDos);
    setText("");
  };
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Pressable onPress={work}>
          <Text
            style={{
              fontSize: 38,
              fontWeight: "600",
              color: working ? "white" : theme.grey,
            }}
          >
            Work
          </Text>
        </Pressable>
        <Pressable onPress={travel}>
          <Text
            style={{
              fontSize: 38,
              fontWeight: "600",
              color: working ? theme.grey : "white",
            }}
          >
            Travel
          </Text>
        </Pressable>
      </View>
      <TextInput
        onSubmitEditing={addToDo}
        style={styles.input}
        onChangeText={onChangeText}
        value={text}
        returnKeyType="done"
        placeholder={
          working ? "What do you have to do ?" : "Where do you want to go ?"
        }
      />
      <ScrollView>
        {toDos.length === 0 ? (
          <View>
            <ActivityIndicator
              style={{ marginTop: 10 }}
              color="white"
              size="large"
            />
          </View>
        ) : (
          Object.keys(toDos).map((key) =>
            toDos[key].working === working ? (
              <View style={styles.toDo} key={key}>
                {toDos[key].completed ? (
                  <>
                    <Pressable onPress={() => onChangeCompleted(key)}>
                      <Fontisto
                        name="checkbox-active"
                        size={18}
                        color={theme.grey}
                      />
                    </Pressable>
                    <Text
                      style={{
                        ...styles.toDoText,
                        textDecorationLine: "line-through",
                      }}
                    >
                      {toDos[key].text}
                    </Text>
                  </>
                ) : (
                  <>
                    <Pressable onPress={() => onChangeCompleted(key)}>
                      <Fontisto
                        name="checkbox-passive"
                        size={18}
                        color={theme.grey}
                      />
                    </Pressable>

                    <Text style={{ ...styles.toDoText }}>
                      {toDos[key].text}
                    </Text>
                  </>
                )}
                <View
                  style={{
                    flexDirection: "row",
                  }}
                >
                  <Fontisto
                    onPress={() => modifyToDo(key)}
                    style={{ marginRight: 15 }}
                    name="redo"
                    size={18}
                    color={theme.grey}
                  />
                  <Pressable onPress={() => deleteToDo(key)}>
                    <Fontisto name="trash" size={18} color={theme.grey} />
                  </Pressable>
                </View>
              </View>
            ) : null
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 100,
  },
  btnText: {},
  input: {
    backgroundColor: "white",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginTop: 20,
    fontSize: 18,
    marginVertical: 20,
  },
  toDo: {
    backgroundColor: theme.toDoBg,
    marginBottom: 10,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 18,
    flexDirection: "row",
    alignItem: "center",
    justifyContent: "space-between",
  },
  toDoText: {
    width: SCREEN_WIDTH / 2,
    color: "white",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 20,
  },
});

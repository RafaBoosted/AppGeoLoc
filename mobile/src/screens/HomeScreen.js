import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import api from '../services/api';

export default function HomeScreen() {
  const [locations, setLocations] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const current = await Location.getCurrentPositionAsync({});
      setUserLocation(current.coords);

      const response = await api.get('/locations');
      setLocations(response.data);
      setLoading(false);
    })();
  }, []);

  const recenterMap = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  };

  const handleAddLocation = () => {
    if (!userLocation) return;

    const newLocation = {
      id: Date.now(),
      name: `Novo Local ${locations.length + 1}`,
      lat: userLocation.latitude,
      lng: userLocation.longitude,
    };

    setLocations((prev) => [newLocation, ...prev]);
    Alert.alert('Local adicionado!', newLocation.name);
  };

  const handleDelete = (id) => {
    Alert.alert('Confirmar', 'Deseja remover este local?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        onPress: () =>
          setLocations((prev) => prev.filter((loc) => loc.id !== id)),
        style: 'destructive',
      },
    ]);
  };

  const handleEdit = (id) => {
    const location = locations.find((l) => l.id === id);
    Alert.prompt(
      'Editar Nome',
      'Digite o novo nome:',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Salvar',
          onPress: (newName) => {
            if (!newName) return;
            setLocations((prev) =>
              prev.map((l) => (l.id === id ? { ...l, name: newName } : l))
            );
          },
        },
      ],
      'plain-text',
      location.name
    );
  };

  const zoomToLocation = (lat, lng) => {
    mapRef.current.animateToRegion({
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const filteredLocations = locations.filter((loc) =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🌍 Meus Locais</Text>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        {filteredLocations.map((loc) => (
          <Marker
            key={loc.id}
            coordinate={{ latitude: loc.lat, longitude: loc.lng }}
            title={loc.name}
          />
        ))}
        <Marker
          coordinate={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          title="Você está aqui"
          pinColor="blue"
        />
      </MapView>

      <TouchableOpacity style={styles.recenterButton} onPress={recenterMap}>
        <Text style={styles.recenterButtonText}>📍</Text>
      </TouchableOpacity>

      <View style={styles.controls}>
        <TextInput
          style={styles.input}
          placeholder="🔎 Buscar local..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddLocation}>
          <Text style={styles.addButtonText}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredLocations}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => zoomToLocation(item.lat, item.lng)}
          >
            <Text style={styles.cardTitle}>📌 {item.name}</Text>
            <Text style={styles.cardText}>Lat: {item.lat} | Lng: {item.lng}</Text>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => handleEdit(item.id)}>
                <Text style={styles.editButton}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteButton}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  header: {
    backgroundColor: '#007bff',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  map: {
    width: '100%',
    height: 250,
  },
  recenterButton: {
    position: 'absolute',
    right: 20,
    top: 220,
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 12,
    elevation: 5,
    zIndex: 1,
  },
  recenterButtonText: {
    fontSize: 20,
  },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 10,
    elevation: 2,
  },
  addButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardText: {
    color: '#555',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  editButton: {
    fontSize: 18,
    marginRight: 16,
  },
  deleteButton: {
    fontSize: 18,
    color: 'red',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

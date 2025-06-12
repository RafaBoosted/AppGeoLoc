import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  TextInput
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function HomeScreen() {
  const [locations, setLocations] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterNearby, setFilterNearby] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const current = await Location.getCurrentPositionAsync({});
      setUserLocation(current.coords);

      const dummyLocations = [
        {
          id: 1,
          name: 'Ponto A',
          lat: current.coords.latitude + 0.001,
          lng: current.coords.longitude + 0.001,
        },
        {
          id: 2,
          name: 'Ponto B',
          lat: current.coords.latitude - 0.001,
          lng: current.coords.longitude - 0.001,
        },
      ];

      setLocations(dummyLocations);
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

    const newLoc = {
      id: Date.now(),
      name: `Novo Local ${locations.length + 1}`,
      lat: userLocation.latitude + (Math.random() * 0.002 - 0.001),
      lng: userLocation.longitude + (Math.random() * 0.002 - 0.001),
    };

    setLocations([newLoc, ...locations]);
    mapRef.current?.animateToRegion({
      latitude: newLoc.lat,
      longitude: newLoc.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Remover local',
      'Tem certeza que deseja remover este local?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            const updated = locations.filter((loc) => loc.id !== id);
            setLocations(updated);
          },
        },
      ]
    );
  };

  const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const toRad = (v) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filteredLocations = locations.filter((loc) => {
    const nameMatch = loc.name.toLowerCase().includes(search.toLowerCase());

    if (!filterNearby || !userLocation) return nameMatch;

    const distance = getDistanceMeters(
      loc.lat,
      loc.lng,
      userLocation.latitude,
      userLocation.longitude
    );

    return nameMatch && distance <= 500;
  });

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Carregando...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🌍 Meus Locais</Text>
      </View>

      <View style={styles.mapContainer}>
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

        <TouchableOpacity style={styles.addButton} onPress={handleAddLocation}>
          <Text style={styles.addButtonText}>＋</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="🔎 Buscar por nome..."
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          onPress={() => setFilterNearby(!filterNearby)}
          style={[
            styles.filterButton,
            filterNearby && { backgroundColor: '#007bff' },
          ]}
        >
          <Text style={styles.filterButtonText}>
            {filterNearby ? '📡 Próximos' : '📍 Todos'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Locais Encontrados</Text>
        <FlatList
          data={filteredLocations}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📌 {item.name}</Text>
              <Text style={styles.cardText}>
                Lat: {item.lat.toFixed(5)} | Lng: {item.lng.toFixed(5)}
              </Text>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id)}
              >
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  header: {
    backgroundColor: '#007bff',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  mapContainer: { position: 'relative' },
  map: { width: '100%', height: 280, borderRadius: 20 },
  recenterButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 30,
    padding: 12,
    elevation: 6,
  },
  recenterButtonText: { fontSize: 20 },
  addButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: '#28a745',
    borderRadius: 30,
    padding: 14,
    elevation: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    elevation: 2,
  },
  filterButton: {
    backgroundColor: '#ccc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 2,
  },
  filterButtonText: { color: '#fff', fontWeight: 'bold' },
  listContainer: { flex: 1, padding: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  list: { paddingBottom: 16 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    paddingRight: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  cardText: { color: '#555' },
  deleteButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: '#ff4d4d',
    borderRadius: 12,
    padding: 6,
  },
  deleteButtonText: { color: '#fff', fontSize: 14 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

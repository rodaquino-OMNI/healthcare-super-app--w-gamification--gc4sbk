import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Updated imports to use @austa packages instead of direct references
import { Card, Input, Button } from '@austa/design-system';
import { Provider } from '@austa/interfaces/care';
import { useJourneyContext } from '@austa/journey-context';
import { searchProviders } from 'src/web/mobile/src/api/care';
import { JourneyHeader } from 'src/web/mobile/src/components/shared/JourneyHeader';
import { useAuth } from 'src/web/mobile/src/hooks/useAuth';
import { LoadingIndicator } from 'src/web/mobile/src/components/shared/LoadingIndicator';
import { ErrorState } from 'src/web/mobile/src/components/shared/ErrorState';

/**
 * A screen component that allows users to search for healthcare providers.
 *
 * @returns {JSX.Element} The rendered ProviderSearchScreen component.
 */
const ProviderSearchScreen: React.FC = () => {
  // Initialize state variables for location, providers, loading, and error.
  const [location, setLocation] = useState<string>('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Retrieve the JWT token from the authentication context using the useAuth hook.
  const { session } = useAuth();
  
  // Use the journey context for care-specific state management
  const { careJourney } = useJourneyContext();

  // Use the navigation hook to access navigation functions.
  const navigation = useNavigation();

  // Define a memoized searchProviders function using useCallback to fetch providers based on the location.
  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Call the searchProviders API function to fetch providers based on the location.
      const providerList = await searchProviders({ location });
      setProviders(providerList);
      
      // Update the care journey context with the search results
      careJourney.setLastProviderSearch({
        query: location,
        resultCount: providerList.length,
        timestamp: new Date().toISOString()
      });
    } catch (e: any) {
      // Set the error state if an error occurs during the provider search.
      setError(e.message || 'Failed to fetch providers');
      setProviders([]);
    } finally {
      // Set the loading state to false after the provider search is complete.
      setLoading(false);
    }
  }, [location, session, careJourney]);

  // Use useEffect to trigger the initial provider search when the component mounts.
  useEffect(() => {
    // Call the handleSearch function to perform the initial provider search.
    handleSearch();
  }, [handleSearch]);

  // Render the ProviderSearchScreen component.
  return (
    <View style={styles.container}>
      {/* Render a JourneyHeader with the title 'Find a Provider'. */}
      <JourneyHeader title="Find a Provider" journey="care" />

      {/* Render an Input component for entering the location. */}
      <Input
        placeholder="Enter location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        accessibilityLabel="Enter location to search for providers"
        journey="care"
      />

      {/* Render a Button component to trigger the provider search. */}
      <Button
        title="Search"
        onPress={handleSearch}
        disabled={loading}
        journey="care"
        accessibilityLabel="Search for providers"
      >
        Search
      </Button>

      {/* Conditionally render a LoadingIndicator while the providers are being fetched. */}
      {loading && <LoadingIndicator journey="care" label="Searching for providers..." />}

      {/* Conditionally render an ErrorState if an error occurs during the provider search. */}
      {error && <ErrorState message={error} journey="care" />}

      {/* Render a list of Provider components if the providers are successfully fetched. */}
      {providers.length > 0 ? (
        providers.map((provider) => (
          <Card 
            key={provider.id} 
            journey="care"
            onPress={() => navigation.navigate('ProviderDetail', { providerId: provider.id })}
            accessibilityLabel={`View details for ${provider.name}`}
          >
            <Card.Title>{provider.name}</Card.Title>
            {provider.specialty && <Card.Subtitle>{provider.specialty}</Card.Subtitle>}
            {provider.address && <Card.Content>{provider.address}</Card.Content>}
          </Card>
        ))
      ) : (
        !loading && !error && <ErrorState message="No providers found. Try a different location." journey="care" variant="empty" />
      )}
    </View>
  );
};

// Define the styles for the ProviderSearchScreen component.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
});

export default ProviderSearchScreen;
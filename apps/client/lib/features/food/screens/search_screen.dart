import 'package:flutter/material.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchController = TextEditingController();
  bool _isSearching = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearch(String query) {
    if (query.trim().isEmpty) return;

    setState(() {
      _isSearching = true;
    });

    // TODO: Implement search API call
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted) {
        setState(() {
          _isSearching = false;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Search Food'),
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search for food...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {});
                        },
                      )
                    : null,
              ),
              textInputAction: TextInputAction.search,
              onSubmitted: _onSearch,
              onChanged: (value) => setState(() {}),
            ),
          ),

          // Barcode scan button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: OutlinedButton.icon(
              onPressed: () {
                // TODO: Implement barcode scanning
              },
              icon: const Icon(Icons.qr_code_scanner),
              label: const Text('Scan Barcode'),
            ),
          ),
          const SizedBox(height: 16),

          // Results area
          Expanded(
            child: _isSearching
                ? const Center(child: CircularProgressIndicator())
                : _searchController.text.isEmpty
                    ? _buildRecentSearches(context)
                    : _buildSearchResults(context),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentSearches(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Recent Searches',
          style: textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        ListTile(
          leading: Icon(Icons.history, color: colorScheme.onSurfaceVariant),
          title: const Text('Chicken breast'),
          onTap: () {
            _searchController.text = 'Chicken breast';
            _onSearch('Chicken breast');
          },
        ),
        ListTile(
          leading: Icon(Icons.history, color: colorScheme.onSurfaceVariant),
          title: const Text('Brown rice'),
          onTap: () {
            _searchController.text = 'Brown rice';
            _onSearch('Brown rice');
          },
        ),
      ],
    );
  }

  Widget _buildSearchResults(BuildContext context) {
    return const Center(
      child: Text('No results found'),
    );
  }
}

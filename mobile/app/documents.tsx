import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { Stack } from "expo-router";
import { api, API_BASE, authHeaders, type Document, type DocumentDetail } from "../src/lib/api";
import { useTheme } from "../src/theme";
import { Markdown } from "../src/components/Markdown";

export default function DocumentsScreen() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentDetail | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const colors = useTheme();
  const insets = useSafeAreaInsets();

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return docs;
    const q = searchQuery.toLowerCase();
    return docs.filter(d => d.title.toLowerCase().includes(q) || d.filename.toLowerCase().includes(q));
  }, [docs, searchQuery]);

  const loadDocs = useCallback(async () => {
    try {
      const res = await api.documents.list();
      setDocs(res.documents);
    } catch (e: unknown) {
      const apiError = e as { status?: number };
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      console.error("[Documents] Failed to load documents:", errorMessage);
      if (apiError.status === 401) {
        Alert.alert("Sign In Required", "Please sign in to access your documents.");
      } else {
        Alert.alert("Error", "Failed to load documents. Please check your connection.");
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "text/plain", "text/markdown"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      setUploading(true);
      const picked = result.assets[0];
      const form = new FormData();
      // React Native's FormData accepts a custom blob-like object with uri
      form.append("file", {
        uri: picked.uri,
        name: picked.name,
        type: picked.mimeType || "application/octet-stream",
      } as unknown as Blob);
      const extra = await authHeaders();
      const uploadResult = await fetch(`${API_BASE}/documents/upload`, {
        method: "POST",
        headers: { ...extra },
        body: form,
      });
      if (!uploadResult.ok) throw new Error(`Upload failed: ${uploadResult.status}`);
      await loadDocs();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      console.error("[Documents] Failed to upload document:", errorMessage);
      Alert.alert("Error", "Failed to upload document. Is the backend running?");
    }
    setUploading(false);
  };

  const deleteDoc = async (id: string) => {
    try {
      await api.documents.delete(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      console.error(`[Documents] Failed to delete document ${id}:`, errorMessage);
      Alert.alert("Error", "Failed to delete document");
    }
  };

  const openPreview = async (id: string) => {
    setPreviewLoading(true);
    try {
      const detail = await api.documents.get(id);
      setPreviewDoc(detail);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      console.error(`[Documents] Failed to load document ${id}:`, errorMessage);
      Alert.alert("Error", "Failed to load document details");
    }
    setPreviewLoading(false);
  };

  const confirmDelete = (id: string, title: string) => {
    Alert.alert(
      "Delete Document",
      `Are you sure you want to delete "${title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteDoc(id) },
      ]
    );
  };

  const handleDocPress = useCallback((item: Document) => {
    openPreview(item.id);
  }, [openPreview]);

  const renderDoc = ({ item }: { item: Document }) => (
    <TouchableOpacity 
      style={[styles.docItem, { backgroundColor: colors.surfaceAlt }]} 
      onPress={() => handleDocPress(item)}
      accessibilityLabel={`Document: ${item.title}`}
      accessibilityRole="button"
      accessibilityHint="Double tap to preview"
    >
      <View style={styles.docInfo}>
        <Text style={[styles.docTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.docMeta, { color: colors.textSecondary }]}>
          {item.filename} {item.file_size ? `· ${(item.file_size / 1024).toFixed(0)} KB` : ""}
        </Text>
      </View>
      <TouchableOpacity onPress={() => confirmDelete(item.id, item.title)} style={styles.deleteBtn} accessibilityLabel={`Delete ${item.title}`} accessibilityRole="button">
        <Text style={[styles.deleteText, { color: colors.danger }]}>Delete</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

    if (loading) {
      return (
        <View style={[styles.centered, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      );
    }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, { paddingBottom: insets.bottom }]}>
      <Stack.Screen
        options={{
          title: "Documents",
          headerRight: () => (
            <TouchableOpacity onPress={pickDocument} disabled={uploading} style={{ padding: 8, minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }} accessibilityLabel="Upload document" accessibilityRole="button">
              {uploading ? (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={[styles.uploadBtn, { color: colors.accent, marginLeft: 4 }]}>...</Text>
                </View>
              ) : (
                <Text style={[styles.uploadBtn, { color: colors.accent }]}>Upload</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search documents..."
          placeholderTextColor={colors.textTertiary}
          clearButtonMode="while-editing"
        />
      </View>

      {docs.length === 0 ? (
        <FlatList
          data={[]}
          keyExtractor={(_item: Document, index: number) => "empty-" + index}
          renderItem={() => null}
          contentContainerStyle={styles.emptyContainer}
          refreshing={loading}
          onRefresh={loadDocs}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No documents yet</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Upload a PDF or text file to get started</Text>
              {uploading && <Text style={[styles.uploadingText, { color: colors.accent }]}>Uploading... please wait</Text>}
              <TouchableOpacity style={[styles.uploadCard, { borderColor: colors.border }]} onPress={pickDocument} disabled={uploading} accessibilityLabel="Upload your first document" accessibilityRole="button">
                <Text style={[styles.uploadCardText, { color: colors.text }]}>{uploading ? "Uploading..." : "Upload your first document"}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredDocs}
          keyExtractor={(item) => item.id}
          renderItem={renderDoc}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={loadDocs}
          ListEmptyComponent={
            searchQuery.trim() ? (
              <View style={styles.emptyList}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No documents match "{searchQuery}"</Text>
              </View>
            ) : null
          }
        />
      )}

      <Modal visible={previewDoc !== null} animationType="slide" onRequestClose={() => setPreviewDoc(null)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{previewDoc?.title}</Text>
            <TouchableOpacity onPress={() => setPreviewDoc(null)} style={{ padding: 8 }} accessibilityLabel="Close preview" accessibilityRole="button">
              <Text style={[styles.modalClose, { color: colors.accent }]}>Close</Text>
            </TouchableOpacity>
          </View>
          {previewDoc && (
            <View style={[styles.modalMeta, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalMetaText, { color: colors.textSecondary }]}>File: {previewDoc.filename}</Text>
              <Text style={[styles.modalMetaText, { color: colors.textSecondary }]}>Type: {previewDoc.content_type}</Text>
              {previewDoc.file_size && (
                <Text style={[styles.modalMetaText, { color: colors.textSecondary }]}>Size: {(previewDoc.file_size / 1024).toFixed(0)} KB</Text>
              )}
              <Text style={[styles.modalMetaText, { color: colors.textSecondary }]}>Uploaded: {new Date(previewDoc.created_at).toLocaleDateString()}</Text>
            </View>
          )}
          {previewLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.text} />
            </View>
          ) : previewDoc?.content ? (
            <ScrollView style={styles.modalContent}>
              <Markdown content={previewDoc.content} colors={colors} />
            </ScrollView>
          ) : (
            <View style={styles.centered}>
              <Text style={[styles.modalMetaText, { color: colors.textSecondary }]}>No content preview available for this file type.</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, paddingBottom: 24 },
  docItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  docInfo: { flex: 1, marginRight: 12 },
  docTitle: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  docMeta: { fontSize: 13 },
  deleteBtn: { padding: 8, minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  deleteText: { fontWeight: "500" },
  emptyContainer: { flex: 1 },
  emptyList: { padding: 40, alignItems: "center" },
  searchInput: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 15, marginBottom: 8,
  },
  uploadingText: { fontSize: 14, marginBottom: 12, textAlign: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
  emptyText: { fontSize: 15, marginBottom: 24, textAlign: "center", lineHeight: 22, maxWidth: 360 },
  uploadCard: {
    borderWidth: 1.5,
    borderStyle: "solid",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: "center",
  },
  uploadCardText: { fontSize: 15, fontWeight: "500" },
  uploadBtn: { fontWeight: "600", fontSize: 16 },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    paddingHorizontal: 18,
  },
  modalTitle: { fontSize: 18, fontWeight: "600", flex: 1, marginRight: 12 },
  modalClose: { fontSize: 16, fontWeight: "500" },
  modalMeta: { padding: 16, borderBottomWidth: 1 },
  modalMetaText: { fontSize: 13, marginBottom: 2 },
  modalContent: { flex: 1, padding: 16 },
  modalContentText: { fontSize: 15, lineHeight: 22 },
});

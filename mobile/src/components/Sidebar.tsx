import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";
import type { Conversation, Document } from "../lib/api";
import { useTheme } from "../theme";

const SIDEBAR_WIDTH = Dimensions.get("window").width * 0.82;

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  convList: Conversation[];
  currentConvId?: string;
  onSwitchConv: (c: Conversation) => void;
  onDeleteConv: (id: string, title: string) => void;
  onNewConv: () => void;
  documents: Document[];
  selectedDocIds: string[];
  onToggleDoc: (id: string) => void;
  onClearDocs: () => void;
  mode: "rag" | "agent";
}

export function Sidebar({
  visible,
  onClose,
  convList,
  currentConvId,
  onSwitchConv,
  onDeleteConv,
  onNewConv,
  documents,
  selectedDocIds,
  onToggleDoc,
  onClearDocs,
  mode,
}: SidebarProps) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, overlayAnim]);

  const filteredConvs = convList.filter(c => {
    if (!searchQuery.trim()) return true;
    return c.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSignOut = useCallback(async () => {
    await signOut();
    onClose();
    router.replace("/");
  }, [signOut, onClose, router]);

  const userEmail = user?.emailAddresses?.[0]?.emailAddress || user?.fullName || "";

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? "auto" : "none"}>
      <Animated.View
        style={[
          styles.overlay,
          { opacity: overlayAnim, backgroundColor: colors.overlay },
        ]}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          {
            width: SIDEBAR_WIDTH,
            backgroundColor: colors.background,
            transform: [{ translateX: slideAnim }],
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.drawerTitle, { color: colors.text }]}>AI Knowledge Assistant</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close sidebar" accessibilityRole="button">
            <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {userEmail ? (
          <View style={[styles.userSection, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>{userEmail}</Text>
          </View>
        ) : null}

        <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search conversations..."
            placeholderTextColor={colors.textTertiary}
            clearButtonMode="while-editing"
          />
        </View>

        <TouchableOpacity
          style={[styles.newConvRow, { borderBottomColor: colors.border }]}
          onPress={() => { onNewConv(); onClose(); }}
          accessibilityLabel="New conversation"
          accessibilityRole="button"
        >
          <Text style={[styles.newConvIcon, { color: colors.accent }]}>+</Text>
          <Text style={[styles.newConvLabel, { color: colors.accent }]}>New Conversation</Text>
        </TouchableOpacity>

        <ScrollView style={styles.convList} showsVerticalScrollIndicator={false}>
          {filteredConvs.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              {searchQuery.trim() ? "No conversations match" : "No conversations yet"}
            </Text>
          ) : (
            filteredConvs.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.convItem,
                  currentConvId === c.id && { backgroundColor: colors.surfaceAlt },
                ]}
                onPress={() => { onSwitchConv(c); onClose(); }}
                accessibilityLabel={`Switch to conversation ${c.title}`}
                accessibilityRole="button"
              >
                <View style={styles.convInfo}>
                  <Text style={[styles.convTitle, { color: colors.text }]} numberOfLines={1}>{c.title}</Text>
                  <Text style={[styles.convMeta, { color: colors.textTertiary }]}>{c.mode} · {new Date(c.updated_at || c.created_at).toLocaleDateString()}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => onDeleteConv(c.id, c.title)}
                  style={styles.deleteBtn}
                  accessibilityLabel={`Delete ${c.title}`}
                  accessibilityRole="button"
                >
                  <Text style={[styles.deleteText, { color: colors.danger }]}>Delete</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {mode === "rag" && documents.length > 0 && (
          <View style={[styles.docSection, { borderTopColor: colors.border }]}>
            <View style={styles.docSectionHeader}>
              <Text style={[styles.docSectionTitle, { color: colors.text }]}>Filter Documents</Text>
              {selectedDocIds.length > 0 && (
                <TouchableOpacity onPress={onClearDocs} accessibilityLabel="Clear all filters" accessibilityRole="button">
                  <Text style={[styles.clearFilterText, { color: colors.accent }]}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView style={styles.docList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {documents.map(doc => (
                <TouchableOpacity
                  key={doc.id}
                  style={[
                    styles.docItem,
                    selectedDocIds.includes(doc.id) && { backgroundColor: colors.successLight },
                  ]}
                  onPress={() => onToggleDoc(doc.id)}
                  accessibilityLabel={`${selectedDocIds.includes(doc.id) ? "Deselect" : "Select"} document ${doc.title}`}
                  accessibilityRole="button"
                >
                  <Text style={[styles.docCheck, { color: selectedDocIds.includes(doc.id) ? colors.success : colors.textTertiary }]}>
                    {selectedDocIds.includes(doc.id) ? "☑" : "☐"}
                  </Text>
                  <View style={styles.docInfo}>
                    <Text style={[styles.docItemTitle, { color: colors.text }]} numberOfLines={1}>{doc.title}</Text>
                    <Text style={[styles.docItemMeta, { color: colors.textTertiary }]}>{doc.filename}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={[styles.signOutSection, { borderTopColor: colors.border }]}>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn} accessibilityLabel="Sign out" accessibilityRole="button">
            <Text style={[styles.signOutText, { color: colors.danger }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 16,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  drawerTitle: { fontSize: 18, fontWeight: "700" },
  closeBtn: { padding: 8, minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  closeText: { fontSize: 20, fontWeight: "600" },
  userSection: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  userEmail: { fontSize: 14 },
  searchContainer: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  searchInput: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 8, fontSize: 14,
  },
  newConvRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  newConvIcon: { fontSize: 22, fontWeight: "600", marginRight: 10 },
  newConvLabel: { fontSize: 15, fontWeight: "600" },
  convList: { flex: 1 },
  emptyText: { textAlign: "center", paddingTop: 24, fontSize: 14 },
  convItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  convInfo: { flex: 1, marginRight: 8 },
  convTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  convMeta: { fontSize: 11 },
  deleteBtn: { padding: 8, minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  deleteText: { fontSize: 13 },
  docSection: {
    maxHeight: 200,
    borderTopWidth: 1,
  },
  docSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  docSectionTitle: { fontSize: 14, fontWeight: "600" },
  clearFilterText: { fontSize: 13, fontWeight: "500" },
  docList: { maxHeight: 140 },
  docItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  docCheck: { fontSize: 18, marginRight: 10 },
  docInfo: { flex: 1 },
  docItemTitle: { fontSize: 13, fontWeight: "500", marginBottom: 1 },
  docItemMeta: { fontSize: 11 },
  signOutSection: {
    borderTopWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  signOutBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  signOutText: { fontSize: 15, fontWeight: "600" },
});

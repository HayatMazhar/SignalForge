import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const C = {
  bg: '#06060B',
  surface: '#0C0F1A',
  accent: '#00FF94',
  danger: '#FF3B5C',
  textPrimary: '#F0F4F8',
  textMuted: '#5B6378',
  border: '#1A1F35',
  warning: '#FFB020',
  info: '#38BDF8',
  purple: '#A78BFA',
};

const AVATAR_COLORS = [C.accent, C.info, C.purple, C.warning, C.danger];

interface Comment {
  id: string;
  username: string;
  message: string;
  timestamp: string;
}

export default function DiscussionScreen() {
  const [symbol, setSymbol] = useState('');
  const [activeSymbol, setActiveSymbol] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const storageKey = `sf-comments-${activeSymbol}`;

  const loadComments = useCallback(async () => {
    if (!activeSymbol) return;
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      setComments(raw ? JSON.parse(raw) : []);
    } catch {
      setComments([]);
    }
  }, [activeSymbol, storageKey]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSetSymbol = () => {
    const trimmed = symbol.trim().toUpperCase();
    if (trimmed) {
      setActiveSymbol(trimmed);
      setComments([]);
    }
  };

  const handlePost = async () => {
    const msg = newMessage.trim();
    if (!msg || !activeSymbol) return;

    const comment: Comment = {
      id: Date.now().toString(),
      username: 'You',
      message: msg,
      timestamp: new Date().toISOString(),
    };

    const updated = [comment, ...comments];
    setComments(updated);
    setNewMessage('');
    await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const avatarColor = (name: string) =>
    AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString();
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={s.commentCard}>
      <View style={[s.avatar, { backgroundColor: avatarColor(item.username) + '25' }]}>
        <Text style={[s.avatarText, { color: avatarColor(item.username) }]}>
          {item.username.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={s.commentBody}>
        <View style={s.commentMeta}>
          <Text style={s.username}>{item.username}</Text>
          <Text style={s.timestamp}>{formatTime(item.timestamp)}</Text>
        </View>
        <Text style={s.message}>{item.message}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={s.symbolRow}>
          <Ionicons name="chatbubbles-outline" size={20} color={C.textMuted} />
          <TextInput
            style={s.symbolInput}
            placeholder="Enter symbol (e.g. AAPL)"
            placeholderTextColor={C.textMuted}
            value={symbol}
            onChangeText={setSymbol}
            autoCapitalize="characters"
            autoCorrect={false}
            onSubmitEditing={handleSetSymbol}
          />
          <TouchableOpacity style={s.goBtn} onPress={handleSetSymbol}>
            <Text style={s.goBtnText}>Go</Text>
          </TouchableOpacity>
        </View>

        {!activeSymbol ? (
          <View style={s.empty}>
            <Ionicons name="chatbubble-ellipses-outline" size={52} color={C.border} />
            <Text style={s.emptyText}>Enter a symbol to view discussions</Text>
          </View>
        ) : (
          <>
            <View style={s.activeHeader}>
              <Text style={s.activeSymbol}>{activeSymbol}</Text>
              <Text style={s.commentCount}>{comments.length} comments</Text>
            </View>

            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={renderComment}
              contentContainerStyle={s.listContent}
              inverted={false}
              ListEmptyComponent={
                <View style={s.emptyBlock}>
                  <Ionicons name="chatbubble-outline" size={40} color={C.textMuted} />
                  <Text style={s.emptyText}>No comments yet. Be the first!</Text>
                </View>
              }
            />

            <View style={s.inputBar}>
              <TextInput
                style={s.messageInput}
                placeholder="Write a comment..."
                placeholderTextColor={C.textMuted}
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[s.sendBtn, !newMessage.trim() && s.sendBtnDisabled]}
                onPress={handlePost}
                disabled={!newMessage.trim()}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={newMessage.trim() ? C.bg : C.textMuted}
                />
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    margin: 16,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: C.border,
  },
  symbolInput: { flex: 1, fontSize: 15, color: C.textPrimary, paddingVertical: 4 },
  goBtn: {
    backgroundColor: C.accent,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  goBtnText: { fontSize: 14, fontWeight: '700', color: C.bg },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  activeSymbol: { fontSize: 18, fontWeight: '800', color: C.info },
  commentCount: { fontSize: 13, color: C.textMuted },
  listContent: { paddingHorizontal: 16, paddingBottom: 8 },
  commentCard: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '800' },
  commentBody: { flex: 1 },
  commentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: { fontSize: 14, fontWeight: '700', color: C.textPrimary },
  timestamp: { fontSize: 11, color: C.textMuted },
  message: { fontSize: 14, color: C.textPrimary, lineHeight: 20 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.surface,
  },
  messageInput: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: C.textPrimary,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: C.border,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: C.border },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyBlock: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: C.textMuted, marginTop: 12, textAlign: 'center' },
});

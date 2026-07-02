import { Image, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { ThemeColors } from "../theme";

function parseInline(text: string, colors: ThemeColors): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<Text key={parts.length} style={{ fontStyle: "italic", fontWeight: "700", color: colors.text }}>{match[2]}</Text>);
    } else if (match[3]) {
      parts.push(<Text key={parts.length} style={{ fontWeight: "700", color: colors.text }}>{match[3]}</Text>);
    } else if (match[4]) {
      parts.push(<Text key={parts.length} style={{ fontStyle: "italic", color: colors.text }}>{match[4]}</Text>);
    } else if (match[5]) {
      parts.push(<Text key={parts.length} style={[styles.inlineCode, { backgroundColor: colors.codeBg, color: colors.codeText }]}>{match[5]}</Text>);
    } else if (match[7]) {
      parts.push(<Image key={parts.length} source={{ uri: match[7] }} style={styles.inlineImage} resizeMode="contain" />);
    } else if (match[9]) {
      const linkUrl = match[9];
      parts.push(
        <TouchableOpacity key={parts.length} onPress={() => Linking.openURL(linkUrl)}>
          <Text style={[styles.inlineLink, { color: colors.link }]}>{match[8]}</Text>
        </TouchableOpacity>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : [text];
}

function isTableRow(line: string): boolean {
  return line.trim().startsWith("|") && line.trim().endsWith("|") && line.includes("|", 1);
}

function isTableSeparator(line: string): boolean {
  return /^\|[\s:-]+\|/.test(line.trim());
}

export function Markdown({ content, colors }: { content: string; colors: ThemeColors }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent = "";
  let codeLang = "";
  let inList: "ul" | "ol" | null = null;
  let listItems: React.ReactNode[] = [];
  let tableRows: string[] = [];
  let inTable = false;

  function flushList() {
    if (inList && listItems.length > 0) {
      elements.push(
        <View key={elements.length} style={styles.list}>
          {listItems}
        </View>
      );
      listItems = [];
      inList = null;
    }
  }

  function flushTable() {
    if (tableRows.length < 2) { tableRows = []; inTable = false; return; }
    const headerCells = tableRows[0].split("|").filter(c => c.trim()).map(c => c.trim());
    const bodyRows = tableRows.slice(2);
    elements.push(
      <View key={elements.length} style={[styles.table, { borderColor: colors.border }]}>
        <View key="header" style={[styles.tableRow, { backgroundColor: colors.surfaceAlt }]}>
          {headerCells.map((cell, ci) => (
            <View key={ci} style={[styles.tableCell, { borderRightColor: colors.border, borderBottomColor: colors.border }]}>
              <Text style={[styles.tableHeaderText, { color: colors.text }]} numberOfLines={1}>{cell}</Text>
            </View>
          ))}
        </View>
        {bodyRows.map((row, ri) => {
          const cells = row.split("|").filter(c => c.trim()).map(c => c.trim());
          return (
            <View key={ri} style={[styles.tableRow, ri < bodyRows.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              {headerCells.map((_, ci) => (
                <View key={ci} style={[styles.tableCell, { borderRightColor: colors.border }]}>
                  <Text style={[styles.tableCellText, { color: colors.text }]} numberOfLines={2}>{cells[ci] || ""}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </View>
    );
    tableRows = [];
    inTable = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      flushTable();
      if (inCodeBlock) {
        elements.push(
          <View key={elements.length} style={[styles.codeBlock, { backgroundColor: colors.codeBg, borderColor: colors.codeBorder }]}>
            {codeLang ? <Text style={[styles.codeLang, { color: colors.textTertiary }]}>{codeLang}</Text> : null}
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <Text style={[styles.codeText, { color: colors.text }]}>{codeContent}</Text>
            </ScrollView>
          </View>
        );
        codeContent = "";
        codeLang = "";
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent += (codeContent ? "\n" : "") + line;
      continue;
    }

    if (isTableRow(line)) {
      if (!inTable) {
        flushList();
        inTable = true;
        tableRows = [];
      }
      tableRows.push(line);
      continue;
    }

    if (inTable && isTableSeparator(line)) {
      continue;
    }

    if (inTable) {
      flushTable();
    }

    flushList();

    if (line.trim() === "") {
      elements.push(<View key={elements.length} style={styles.spacer} />);
      continue;
    }

    if (/^#{1,4}\s/.test(line)) {
      const level = line.match(/^#{1,4}/)![0].length;
      const text = line.replace(/^#{1,4}\s*/, "");
      const style = level <= 2 ? styles.h2 : styles.h3;
      elements.push(
        <Text key={elements.length} style={[style, { color: colors.text }]}>{parseInline(text, colors)}</Text>
      );
      continue;
    }

    if (/^[-*]\s/.test(line)) {
      const text = line.replace(/^[-*]\s*/, "");
      elements.push(
        <View key={elements.length} style={styles.listItem}>
          <Text style={[styles.bullet, { color: colors.text }]}>{"\u2022"}</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>{parseInline(text, colors)}</Text>
        </View>
      );
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\.\s*/)![1];
      const text = line.replace(/^\d+\.\s*/, "");
      elements.push(
        <View key={elements.length} style={styles.listItem}>
          <Text style={[styles.bullet, { color: colors.text }]}>{num}.</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>{parseInline(text, colors)}</Text>
        </View>
      );
      continue;
    }

    if (/^>\s/.test(line)) {
      const text = line.replace(/^>\s*/, "");
      elements.push(
        <View key={elements.length} style={[styles.blockquote, { backgroundColor: colors.blockquoteBg, borderLeftColor: colors.blockquoteBorder }]}>
          <Text style={[styles.paragraph, { color: colors.text }]}>{parseInline(text, colors)}</Text>
        </View>
      );
      continue;
    }

    if (/^---+\s*$/.test(line)) {
      elements.push(<View key={elements.length} style={[styles.hr, { backgroundColor: colors.border }]} />);
      continue;
    }

    elements.push(
      <Text key={elements.length} style={[styles.paragraph, { color: colors.text }]}>{parseInline(line, colors)}</Text>
    );
  }

  if (inCodeBlock) {
    elements.push(
      <View key={elements.length} style={[styles.codeBlock, { backgroundColor: colors.codeBg, borderColor: colors.codeBorder }]}>
        {codeLang ? <Text style={[styles.codeLang, { color: colors.textTertiary }]}>{codeLang}</Text> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <Text style={[styles.codeText, { color: colors.text }]}>{codeContent}</Text>
        </ScrollView>
      </View>
    );
  }

  flushTable();
  flushList();

  return <>{elements}</>;
}

const monoFont = Platform.OS === "ios" ? "Menlo" : Platform.OS === "android" ? "monospace" : "monospace";

const styles = StyleSheet.create({
  paragraph: { fontSize: 15, lineHeight: 22, marginBottom: 4 },
  h2: { fontSize: 17, fontWeight: "700", marginTop: 12, marginBottom: 4 },
  h3: { fontSize: 16, fontWeight: "600", marginTop: 8, marginBottom: 4 },
  inlineCode: {
    fontFamily: monoFont, fontSize: 13,
    paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4,
  },
  codeBlock: {
    borderRadius: 8, padding: 12, marginVertical: 6,
    borderWidth: 1,
  },
  codeLang: { fontSize: 11, fontWeight: "600", marginBottom: 6, textTransform: "uppercase" },
  codeText: { fontFamily: monoFont, fontSize: 13, lineHeight: 18 },
  inlineLink: { textDecorationLine: "underline", fontSize: 15, lineHeight: 22 },
  inlineImage: { width: "100%", height: 200, borderRadius: 8, marginVertical: 4 },
  blockquote: {
    borderLeftWidth: 3, paddingLeft: 12,
    marginVertical: 4, borderRadius: 4, paddingVertical: 8, paddingRight: 8,
  },
  list: { marginVertical: 4 },
  listItem: { flexDirection: "row", marginBottom: 2, paddingLeft: 4 },
  bullet: { width: 20, fontSize: 15 },
  hr: { height: 1, marginVertical: 8 },
  spacer: { height: 6 },
  table: { borderWidth: 1, borderRadius: 8, marginVertical: 6, overflow: "hidden" },
  tableRow: { flexDirection: "row" },
  tableCell: {
    flex: 1, paddingHorizontal: 8, paddingVertical: 6,
    borderRightWidth: 1,
  },
  tableHeaderText: { fontSize: 13, fontWeight: "700" },
  tableCellText: { fontSize: 13 },
});

package livedirections.json.api;

import java.util.AbstractCollection;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;

public abstract class Json {
	protected static Json ToJson(Object p)
	{
		return p instanceof Json ? (Json)p : new Val(p);
	}
	public static class Val extends Json {
		private Object val;
		public Val(Object val) { this.val = val; }
		public String toString()
		{
			return
				val instanceof String ? Util.enquote((String)val) :
				val == null ? "null" :
				val instanceof Boolean ? ((Boolean)val ? "true" : "false") :
				Util.enquote(val.toString());
		}
	}
	public static abstract class List extends Json {
		protected ArrayList<Json> list = new ArrayList<Json>();
		public String toString()
		{
			return Util.join(list, ",");
		}
	}
	public static class Arr extends List {
		public Arr(Object... p)
		{
			for (Object item : p)
				this.add(item);
		}
		public Arr add(Object val) { this.list.add(ToJson(val)); return this; }
		public String toString() { return "[" + super.toString() + "]"; }
	}
	public static class Obj extends List {
		public Obj(Object... p)
		{
			for (int i = 0; i + 1 < p.length; i += 2)
				this.add((String)p[i], p[i + 1]);
		}
		private class Prop extends Json {
			private Val name;
			private Json val;
			private Prop(String name, Object val)
			{
				this.name = new Val(name);
				this.val = ToJson(val);
			}
			public String toString() { return name.toString() + ":" + val.toString(); }
		}
		public Obj add(String name, Object val) { this.list.add(new Prop(name, val)); return this; }
		public String toString() { return "{" + super.toString() + "}"; }
	}
	public static class Util {
		private Util() {}
		/// <summary>
		/// Produce a string in double quotes with backslash sequences in all the right places.
		/// </summary>
		/// <param name="s">A String</param>
		/// <returns>A String correctly formatted for insertion in a JSON message.</returns>
		public static String enquote(String s)
		{
			if (s == null || s.length() == 0)
				return "\"\"";

			char c;
			int i;
			int len = s.length();
			StringBuilder sb = new StringBuilder(len + 4);

			sb.append('"');
			for (i = 0; i < len; i += 1)
			{
				c = s.charAt(i);
				if (c == '\\' || c == '"' || c == '/')
				{
					sb.append('\\');
					sb.append(c);
				}
				else if (c == '\b')
					sb.append("\\b");
				else if (c == '\t')
					sb.append("\\t");
				else if (c == '\n')
					sb.append("\\n");
				else if (c == '\f')
					sb.append("\\f");
				else if (c == '\r')
					sb.append("\\r");
				else if (c < ' ' || c > '~') {
					String hex = Integer.toHexString(/*c*/s.codePointAt(i)).toUpperCase();
					if (hex.length() < 4) {
						char[] fill = new char[4 - hex.length()];
						Arrays.fill(fill, '0');
						hex = new String(fill) + hex;
					}
					sb.append("\\u" + hex);
				} else
					sb.append(c);
			}
			sb.append('"');
			return sb.toString();
		}
		public static String join(AbstractCollection<Json> s, String delimiter)
		{
			if (s == null || s.isEmpty())
				return "";
			Iterator<Json> iter = s.iterator();
			StringBuilder builder = new StringBuilder(iter.next().toString());
			while(iter.hasNext())
				builder.append(delimiter).append(iter.next().toString());
			return builder.toString();
		}
	}
}
